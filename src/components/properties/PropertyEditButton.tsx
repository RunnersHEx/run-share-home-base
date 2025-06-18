
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import PropertyWizard from "./PropertyWizard";
import { Property } from "@/types/property";

interface PropertyEditButtonProps {
  property: Property;
  onPropertyUpdated?: () => void;
}

const PropertyEditButton = ({ property, onPropertyUpdated }: PropertyEditButtonProps) => {
  const [showEditWizard, setShowEditWizard] = useState(false);

  const handleEditComplete = () => {
    setShowEditWizard(false);
    if (onPropertyUpdated) {
      onPropertyUpdated();
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowEditWizard(true)}
        className="flex-1"
      >
        <Edit className="h-4 w-4 mr-1" />
        Editar
      </Button>

      {showEditWizard && (
        <PropertyWizard 
          onClose={handleEditComplete}
          propertyId={property.id}
          initialData={property}
        />
      )}
    </>
  );
};

export default PropertyEditButton;
