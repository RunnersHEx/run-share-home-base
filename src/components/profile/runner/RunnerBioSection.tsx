
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RunnerBioSectionProps {
  bio: string;
  isEditing: boolean;
  profileBio?: string;
  onBioChange: (bio: string) => void;
}

const RunnerBioSection = ({ bio, isEditing, profileBio, onBioChange }: RunnerBioSectionProps) => {
  return (
    <div className="space-y-2">
      <Label>Cuéntanos sobre ti como corredor</Label>
      <p className="text-sm text-red-600 font-medium mb-2">
        Debes completar esta sección de biografía de corredor con al menos 50 caracteres para poder solicitar reservas de carreras
      </p>
      <Textarea
        placeholder={isEditing ? "Háblanos de tu pasión por el running, objetivos, experiencias..." : ""}
        value={isEditing ? bio : (profileBio || "No especificado")}
        onChange={(e) => onBioChange(e.target.value)}
        disabled={!isEditing}
        className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
        maxLength={500}
        rows={4}
      />
      {isEditing && (
        <div className="text-right text-sm text-gray-500">
          {bio.length}/500 caracteres
        </div>
      )}
    </div>
  );
};

export default RunnerBioSection;
