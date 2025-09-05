
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash } from "lucide-react";

const DeleteAccountSection = () => {
  const { user, signOut } = useAuth();
  const [confirmationText, setConfirmationText] = useState("");
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const userEmail = user?.email || "";
  const validConfirmations = ["ELIMINAR MI CUENTA", "DELETE MY ACCOUNT"];
  const isConfirmationValid = validConfirmations.includes(confirmationText) && hasAcceptedTerms;

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) {
      toast.error("Por favor, completa todos los campos requeridos");
      return;
    }

    setIsDeleting(true);
    
    try {
      const userId = user?.id;
      if (!userId) {
        toast.error("Error: usuario no identificado");
        setIsDeleting(false);
        return;
      }

      console.log('Starting account deletion for user:', userId);
      console.log('Confirmation text being sent:', JSON.stringify(confirmationText));
      console.log('Confirmation text length:', confirmationText.length);
      console.log('Valid confirmations check:', validConfirmations.includes(confirmationText));

      // Call the delete-user Edge Function
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          user_id: userId,
          confirmation_text: confirmationText.trim() // Ensure no extra spaces
        }
      });

      if (error) {
        console.error('Error calling delete-user function:', error);
        toast.error("Error al procesar la eliminación de cuenta. Por favor, inténtalo de nuevo.");
        setIsDeleting(false);
        return;
      }

      if (data?.error) {
        console.error('Error from delete-user function:', data.error);
        console.error('Error details:', data.details);
        console.error('Received text:', data.received_text);
        console.error('Valid options:', data.valid_options);
        toast.error(data.error || "Error al eliminar la cuenta");
        setIsDeleting(false);
        return;
      }

      console.log('Account deletion completed:', data);
      
      // Sign out the user
      await signOut();
      
      // Show appropriate message based on result
      if (data?.warning) {
        toast.success(data.message || "Tu cuenta ha sido eliminada correctamente", {
          description: "Si tienes problemas para acceder, contacta al soporte."
        });
      } else {
        toast.success("Tu cuenta ha sido eliminada correctamente");
      }
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Error al eliminar la cuenta. Por favor, inténtalo de nuevo.");
    } finally {
      setIsDeleting(false);
      // Only close dialog after everything is complete
      setShowDialog(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Eliminar mi cuenta</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
            <div className="text-sm text-red-800">
              <h4 className="font-semibold mb-2">⚠️ Acción irreversible</h4>
              <p className="mb-2">
                Al eliminar tu cuenta se borrarán permanentemente:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Tu perfil personal y de runner</li>
                <li>Todas tus propiedades publicadas</li>
                <li>Todas las carreras que hayas compartido</li>
                <li>Tu historial de reservas y calificaciones</li>
                <li>Tus puntos acumulados</li>
                <li>Todos los badges y logros obtenidos</li>
              </ul>
              <p className="font-semibold">
                Esta acción no se puede deshacer. Si cambias de opinión, tendrás que crear una cuenta completamente nueva.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email-display" className="text-sm font-medium text-gray-700">
              Cuenta a eliminar:
            </Label>
            <Input
              id="email-display"
              value={userEmail}
              disabled
              className="bg-gray-100 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmation" className="text-sm font-medium text-gray-700">
              Para confirmar, escribe exactamente: <span className="font-bold">ELIMINAR MI CUENTA</span> o <span className="font-bold">DELETE MY ACCOUNT</span>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="ELIMINAR MI CUENTA o DELETE MY ACCOUNT"
              className="mt-1"
              disabled={isDeleting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept-terms"
              checked={hasAcceptedTerms}
              onCheckedChange={(checked) => setHasAcceptedTerms(!!checked)}
              disabled={isDeleting}
            />
            <Label htmlFor="accept-terms" className="text-sm text-gray-700">
              Entiendo que esta acción es irreversible y acepto eliminar permanentemente mi cuenta y todos mis datos
            </Label>
          </div>
        </div>

        <AlertDialog open={showDialog} onOpenChange={(open) => {
          // Only allow closing if not currently deleting
          if (!isDeleting) {
            setShowDialog(open);
          }
        }}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={!isConfirmationValid || isDeleting}
              className="w-full"
            >
              <Trash className="h-4 w-4 mr-2" />
              {isDeleting ? "Eliminando..." : "Eliminar mi cuenta permanentemente"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">
                ¿Estás completamente seguro?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                {isDeleting ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      <span>Eliminando tu cuenta y todos tus datos...</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Por favor espera, este proceso puede tomar unos momentos.
                    </div>
                  </div>
                ) : (
                  <div>
                    Esta es tu última oportunidad para cancelar. Una vez confirmes, tu cuenta y todos tus datos serán eliminados permanentemente de nuestros servidores. No podremos recuperar tu información.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Eliminando...</span>
                  </div>
                ) : (
                  "Sí, eliminar definitivamente"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DeleteAccountSection;
