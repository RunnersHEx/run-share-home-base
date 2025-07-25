
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/custom";
import { Users } from "lucide-react";

interface AccommodationFiltersProps {
  maxGuests: number;
  onMaxGuestsChange: (guests: number) => void;
  selectedRating: string;
  onRatingChange: (rating: string) => void;
}

const guestOptions = [
  { value: "1", label: "1 huésped" },
  { value: "2", label: "2 huéspedes" },
  { value: "3", label: "3 huéspedes" },
  { value: "4", label: "4 huéspedes" }
];

const ratingOptions = [
  { value: "any", label: "Cualquier rating" },
  { value: "4.0", label: "4.0+ estrellas" },
  { value: "4.5", label: "4.5+ estrellas" },
  { value: "4.8", label: "4.8+ estrellas" }
];

export const AccommodationFilters = ({
  maxGuests,
  onMaxGuestsChange,
  selectedRating,
  onRatingChange
}: AccommodationFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-[#1E40AF]" />
        <h3 className="font-semibold">Alojamiento y Experiencia</h3>
      </div>
      
      <div className="space-y-4">
        {/* Número máximo de huéspedes */}
        <div>
          <Label className="text-sm font-medium">Número máximo huéspedes</Label>
          <CustomSelect
            value={maxGuests.toString()}
            onValueChange={(value) => onMaxGuestsChange(parseInt(value))}
            options={guestOptions}
            className="mt-1"
          />
        </div>

        {/* Rating mínimo */}
        <div>
          <Label className="text-sm font-medium">Rating mínimo del host</Label>
          <CustomSelect
            value={selectedRating}
            onValueChange={onRatingChange}
            options={ratingOptions}
            placeholder="Cualquier rating"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
