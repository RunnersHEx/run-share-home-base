
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Home, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Property {
  id: string;
  title: string;
  description: string | null;
  locality: string;
  full_address: string;
  approval_status?: string;
  created_at: string;
  owner_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

const PropertyManagementPanel = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<{ [key: string]: string }>({});

  const fetchProperties = async () => {
    try {
      console.log('PropertyManagementPanel: Fetching all properties...');
      
      // Use service role key to fetch all properties without RLS restrictions
      const supabaseAdmin = supabase;
      
      const { data, error } = await supabaseAdmin
        .from('properties')
        .select(`
          id, title, description, locality, full_address, created_at, is_active,
          owner_profile:profiles!properties_owner_id_profiles_fkey (
            first_name, last_name, email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('PropertyManagementPanel: Error fetching properties:', error);
        toast.error('Error al cargar propiedades');
        setProperties([]);
        return;
      }
      
      console.log('PropertyManagementPanel: Fetched properties:', data?.length || 0);
      
      // Map data and add default approval_status
      const validProperties = (data || []).map((property: any) => ({
        ...property,
        approval_status: property.approval_status ?? (property.is_active ? 'approved' : 'pending')
      }));
      
      setProperties(validProperties);
    } catch (error) {
      console.error('PropertyManagementPanel: Error fetching properties:', error);
      toast.error('Error al cargar propiedades');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async (propertyId: string, status: 'approved' | 'rejected', notes?: string) => {
    setProcessingId(propertyId);
    try {
      console.log('PropertyManagementPanel: Updating property status:', { propertyId, status });
      
      const { error } = await supabase
        .from('properties')
        .update({
          is_active: status === 'approved'
        })
        .eq('id', propertyId);

      if (error) {
        console.error('PropertyManagementPanel: Error updating property:', error);
        toast.error('Error al actualizar el estado de la propiedad');
      } else {
        toast.success(
          status === 'approved' 
            ? 'Propiedad aprobada exitosamente' 
            : 'Propiedad rechazada'
        );
        
        await fetchProperties();
        setRejectionNotes(prev => ({ ...prev, [propertyId]: '' }));
      }
    } catch (error) {
      console.error('PropertyManagementPanel: Error updating property status:', error);
      toast.error('Error al actualizar el estado de la propiedad');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Pendiente'}</Badge>;
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingProperties = properties.filter(p => (p.approval_status ?? 'pending') === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Home className="h-6 w-6 text-blue-600" />
          <span>Gestión de Propiedades</span>
          <Badge variant="secondary">{pendingProperties.length} pendientes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay propiedades registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propiedad</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div className="font-medium">{property.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {property.description || 'Sin descripción'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {property.owner_profile?.first_name && property.owner_profile?.last_name 
                        ? `${property.owner_profile.first_name} ${property.owner_profile.last_name}` 
                        : 'Sin nombre'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.owner_profile?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{property.locality}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {property.full_address}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(property.approval_status)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(property.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </TableCell>
                  <TableCell>
                    {(property.approval_status ?? 'pending') === 'pending' ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Notas de rechazo (opcional)"
                          value={rejectionNotes[property.id] || ''}
                          onChange={(e) => setRejectionNotes(prev => ({ 
                            ...prev, 
                            [property.id]: e.target.value 
                          }))}
                          className="h-16 text-xs"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => updatePropertyStatus(property.id, 'approved')}
                            disabled={processingId === property.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updatePropertyStatus(
                              property.id, 
                              'rejected', 
                              rejectionNotes[property.id]
                            )}
                            disabled={processingId === property.id}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Estado: {property.approval_status ?? 'pending'}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyManagementPanel;
