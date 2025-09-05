import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, Star, Users, Calendar, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Coupon {
  code: string;
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  validUntil: string;
  isActive: boolean;
  type: string;
}

interface SubscriptionFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isLoading: boolean;
}

const SubscriptionForm = ({ onSubmit, onBack, initialData, isLoading }: SubscriptionFormProps) => {
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [customCouponCode, setCustomCouponCode] = useState("");
  const [planSelected, setPlanSelected] = useState(false);
  const [couponValidationError, setCouponValidationError] = useState("");

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const { data, error } = await supabase.functions.invoke('get-active-coupons');
      
      if (error) {
        console.error('Error fetching coupons:', error);
        toast.error('Error loading offers');
        return;
      }

      setCoupons(data?.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Error loading offers');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const validateCouponCode = (code: string): boolean => {
    const validCodes = coupons.map(c => c.code);
    const isValid = validCodes.includes(code.toUpperCase()) || code === "";
    
    if (!isValid && code.trim() !== "") {
      setCouponValidationError(`Código "${code}" no válido. Códigos disponibles: ${validCodes.join(", ")}`);
    } else {
      setCouponValidationError("");
    }
    
    return isValid;
  };

  const handleCouponSelection = (couponCode: string) => {
    setSelectedCoupon(couponCode);
    setCustomCouponCode(couponCode); // Auto-fill the input with the selected coupon code
    setPlanSelected(true);
    setCouponValidationError("");
  };

  const handleCustomCouponChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setCustomCouponCode(upperValue);
    
    if (upperValue.trim()) {
      setSelectedCoupon("");
      validateCouponCode(upperValue);
      setPlanSelected(true);
    } else {
      setPlanSelected(false);
      setCouponValidationError("");
    }
  };

  const handleRegularPriceSelection = () => {
    setSelectedCoupon("");
    setCustomCouponCode("");
    setPlanSelected(true);
    setCouponValidationError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate plan selection
    if (!planSelected && !selectedCoupon && !customCouponCode.trim()) {
      toast.error('Por favor selecciona un plan antes de continuar');
      return;
    }
    
    // Validate custom coupon if entered
    const finalCouponCode = selectedCoupon || customCouponCode.trim().toUpperCase();
    if (customCouponCode.trim() && !validateCouponCode(customCouponCode.trim())) {
      return;
    }
    
    // Prepare registration data to send to Stripe (account will be created after payment)
    const registrationData = {
      selectedPlan: true,
      couponCode: finalCouponCode || null,
      plannedPrice: getSelectedPrice(),
      savings: finalCouponCode ? 59 - getSelectedPrice() : 0,
      // Include all form data for account creation after payment
      registrationInfo: initialData
    };
    
    // Pass to parent to handle Stripe redirect with registration data
    onSubmit(registrationData);
  };

  const getSelectedPrice = () => {
    if (selectedCoupon) {
      const coupon = coupons.find(c => c.code === selectedCoupon);
      return coupon ? coupon.discountedPrice : 59;
    }
    if (customCouponCode.trim() && !couponValidationError) {
      const coupon = coupons.find(c => c.code === customCouponCode.toUpperCase());
      return coupon ? coupon.discountedPrice : 59;
    }
    return 59;
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Último paso! Suscríbete para completar tu registro</h3>
          <p className="text-sm text-gray-600">
            Elige tu plan de suscripción para acceder a todas las funcionalidades de RunnersHEx
          </p>
        </div>

        {/* Current Offers */}
        {loadingCoupons ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Cargando ofertas...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {coupons.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-blue-600" />
                  Ofertas Especiales Disponibles
                </h4>
                <div className="grid gap-4">
                  {coupons.map((coupon) => (
                    <Card 
                      key={coupon.code}
                      className={`border-2 relative cursor-pointer transition-all transform hover:scale-[1.02] ${
                        selectedCoupon === coupon.code 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : 'border-orange-300 hover:border-orange-400 hover:shadow-md'
                      } ${coupon.type === 'friends' ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'bg-gradient-to-br from-orange-50 to-red-50'}`}
                      onClick={() => handleCouponSelection(coupon.code)}
                    >
                      <div className="absolute top-3 right-3">
                        {coupon.type === 'friends' ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                            <Users className="h-3 w-3 mr-1" />
                            Solo Amigos
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">
                            <Star className="h-3 w-3 mr-1" />
                            Lanzamiento
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start pr-24">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {coupon.name}
                              {selectedCoupon === coupon.code && (
                                <Check className="h-5 w-5 ml-2 text-blue-600" />
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">{coupon.description}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <span className="text-lg line-through text-gray-400 mr-2">€{coupon.originalPrice}</span>
                              <span className="text-2xl font-bold text-green-600">€{coupon.discountedPrice}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Hasta {coupon.validUntil}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Prominent Coupon Code Display */}
                          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-600 mb-1">Usa este código:</div>
                            <div className="text-xl font-bold text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded border">
                              {coupon.code}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Copia este código para obtener la oferta</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              Ahorro €{coupon.originalPrice - coupon.discountedPrice}
                            </div>
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              Acceso completo
                            </div>
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              Válido 1 año
                            </div>
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              Solo 1 pago
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          className={`w-full mt-4 transition-all ${
                            selectedCoupon === coupon.code 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCouponSelection(coupon.code);
                          }}
                        >
                          {selectedCoupon === coupon.code ? (
                            <span className="flex items-center">
                              <Check className="h-4 w-4 mr-2" />
                              Seleccionado
                            </span>
                          ) : (
                            'Seleccionar Esta Oferta'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Coupon Code Input */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">¿Tienes un código personalizado?</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="CÓDIGO (ej: FRIENDS15, LAUNCH35)"
                    value={customCouponCode}
                    onChange={(e) => handleCustomCouponChange(e.target.value)}
                    className={`flex-1 uppercase font-mono ${
                      couponValidationError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    maxLength={20}
                  />
                  {customCouponCode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCustomCouponCode("");
                        setPlanSelected(false);
                        setCouponValidationError("");
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
                {couponValidationError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    ⚠️ {couponValidationError}
                  </div>
                )}
                {customCouponCode && !couponValidationError && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    ✅ Código válido: {customCouponCode}
                  </div>
                )}
              </div>
            </div>

            {/* Option to not use any coupon - Regular Price */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">O elige el precio regular</h4>
              <Card 
                className={`border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                  planSelected && !selectedCoupon && !customCouponCode
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                }`}
                onClick={handleRegularPriceSelection}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        Precio Regular
                        {planSelected && !selectedCoupon && !customCouponCode && (
                          <Check className="h-5 w-5 ml-2 text-blue-600" />
                        )}
                      </CardTitle>
                      <CardDescription>Acceso completo sin descuento</CardDescription>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">€59</span>
                      <div className="text-xs text-gray-500">por año</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-2" />
                      Acceso completo
                    </div>
                    <div className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-2" />
                      Sin restricciones
                    </div>
                    <div className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-2" />
                      Válido 1 año
                    </div>
                  </div>
                  <Button
                    type="button"
                    className={`w-full transition-all ${
                      planSelected && !selectedCoupon && !customCouponCode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegularPriceSelection();
                    }}
                  >
                    {planSelected && !selectedCoupon && !customCouponCode ? (
                      <span className="flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        Seleccionado
                      </span>
                    ) : (
                      'Seleccionar Precio Regular'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total a pagar:</span>
            <div className="text-right">
              {(selectedCoupon || (customCouponCode && !couponValidationError)) && (
                <div className="text-sm text-gray-500 line-through">€59.00</div>
              )}
              <div className="text-xl font-bold text-green-600">
                €{getSelectedPrice()}.00
              </div>
            </div>
          </div>
          {(selectedCoupon || (customCouponCode && !couponValidationError)) && (
            <div className="text-sm text-green-600 mt-1">
              ¡Ahorras €{59 - getSelectedPrice()}!
            </div>
          )}
        </div>



        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
          <Button 
            type="submit" 
            className={`flex-1 transition-all ${
              (planSelected || selectedCoupon || (customCouponCode && !couponValidationError))
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`} 
            disabled={
              isLoading || 
              (!planSelected && !selectedCoupon && !(customCouponCode && !couponValidationError))
            }
          >
            {isLoading ? "Procesando..." : "Continuar al Pago"}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {(planSelected || selectedCoupon || customCouponCode) ? (
            "Al continuar, serás redirigido a Stripe para completar el pago de forma segura."
          ) : (
            "Selecciona un plan para continuar al pago seguro."
          )}
        </p>
      </form>
    </>
  );
};

export default SubscriptionForm;