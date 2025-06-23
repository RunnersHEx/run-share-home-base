
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
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
  const isConfirmationValid = confirmationText === "ELIMINAR MI CUENTA" && hasAcceptedTerms;

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) {
      toast.error("Por favor, completa todos los campos requeridos");
      return;
    }

    setIsDeleting(true);
    
    try {
      // Delete user profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        toast.error("Error al eliminar el perfil de usuario");
        setIsDeleting(false);
        return;
      }

      // Delete user properties
      const { error: propertiesError } = await supabase
        .from('properties')
        .delete()
        .eq('owner_id', user?.id);

      if (propertiesError) {
        console.error('Error deleting properties:', propertiesError);
      }

      // Delete user races
      const { error: racesError } = await supabase
        .from('races')
        .delete()
        .eq('host_id', user?.id);

      if (racesError) {
        console.error('Error deleting races:', racesError);
      }

      // Sign out the user
      await signOut();
      
      toast.success("Tu cuenta ha sido eliminada correctamente");
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Error al eliminar la cuenta. Por favor, inténtalo de nuevo.");
    } finally {
      setIsDeleting(false);
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
              Para confirmar, escribe exactamente: <span className="font-bold">ELIMINAR MI CUENTA</span>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="ELIMINAR MI CUENTA"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept-terms"
              checked={hasAcceptedTerms}
              onCheckedChange={(checked) => setHasAcceptedTerms(!!checked)}
            />
            <Label htmlFor="accept-terms" className="text-sm text-gray-700">
              Entiendo que esta acción es irreversible y acepto eliminar permanentemente mi cuenta y todos mis datos
            </Label>
          </div>
        </div>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={!isConfirmationValid}
              className="w-full"
            >
              <Trash className="h-4 w-4 mr-2" />
              Eliminar mi cuenta permanentemente
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">
                ¿Estás completamente seguro?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta es tu última oportunidad para cancelar. Una vez confirmes, 
                tu cuenta y todos tus datos serán eliminados permanentemente de 
                nuestros servidores. No podremos recuperar tu información.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DeleteAccountSection;
