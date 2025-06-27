
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

interface AccommodationFiltersProps {
  maxGuests: number;
  onMaxGuestsChange: (guests: number) => void;
}

export const AccommodationFilters = ({
  maxGuests,
  onMaxGuestsChange
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
          <Select value={maxGuests.toString()} onValueChange={(value) => onMaxGuestsChange(parseInt(value))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 huésped</SelectItem>
              <SelectItem value="2">2 huéspedes</SelectItem>
              <SelectItem value="3">3 huéspedes</SelectItem>
              <SelectItem value="4">4 huéspedes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating mínimo */}
        <div>
          <Label className="text-sm font-medium">Rating mínimo del host</Label>
          <Select>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Cualquier rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquier rating</SelectItem>
              <SelectItem value="4.0">4.0+ estrellas</SelectItem>
              <SelectItem value="4.5">4.5+ estrellas</SelectItem>
              <SelectItem value="4.8">4.8+ estrellas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
