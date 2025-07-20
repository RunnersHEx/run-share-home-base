
import { Label } from "@/components/ui/label";
import { RunningExperience, RUNNING_EXPERIENCE_OPTIONS } from "@/types/profile";
import { memo, useState, useEffect, useRef } from "react";

interface RunnerExperienceSectionProps {
  experience: RunningExperience | null;
  isEditing: boolean;
  onExperienceChange: (experience: RunningExperience) => void;
}

// Simple native select to avoid Radix UI issues
const ExperienceSelect = memo(({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Selecciona tu nivel de experiencia</option>
      {RUNNING_EXPERIENCE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

ExperienceSelect.displayName = 'ExperienceSelect';

const RunnerExperienceSection = memo(({ experience, isEditing, onExperienceChange }: RunnerExperienceSectionProps) => {
  // Use a ref to track component mounting
  const mountedRef = useRef(false);
  const [localValue, setLocalValue] = useState<string>(experience || "");
  const [componentKey, setComponentKey] = useState(0);

  // Initialize and sync with external value
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(experience || "");
    }
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Force a fresh render to clear any stale state
      setComponentKey(prev => prev + 1);
    }
  }, [experience, isEditing]);

  // Listen for profile updates to force clean state
  useEffect(() => {
    const handleProfileUpdate = () => {
      setComponentKey(prev => prev + 1);
      setLocalValue(experience || "");
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [experience]);

  // Find the display option
  const selectedOption = RUNNING_EXPERIENCE_OPTIONS.find(
    opt => opt.value === (isEditing ? localValue : experience)
  );

  // Handle value changes
  const handleValueChange = (value: string) => {
    if (value && ['beginner', 'intermediate', 'advanced', 'expert', 'elite'].includes(value)) {
      setLocalValue(value);
      onExperienceChange(value as RunningExperience);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-2" key={`view-${componentKey}`}>
        <Label>Años de experiencia corriendo</Label>
        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
          {selectedOption?.label || "No especificado"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2" key={`edit-${componentKey}`}>
      <Label>Años de experiencia corriendo</Label>
      <ExperienceSelect 
        value={localValue}
        onChange={handleValueChange}
      />
    </div>
  );
});

// Set display name for debugging
RunnerExperienceSection.displayName = 'RunnerExperienceSection';

export default RunnerExperienceSection;
