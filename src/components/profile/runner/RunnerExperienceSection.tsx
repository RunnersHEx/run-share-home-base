
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface RunnerExperienceSectionProps {
  experience: string;
  isEditing: boolean;
  onExperienceChange: (experience: string) => void;
}

const experienceOptions = [
  { value: '0-1', label: 'Menos de 1 año' },
  { value: '1-3', label: '1-3 años' },
  { value: '3-5', label: '3-5 años' },
  { value: '5-10', label: '5-10 años' },
  { value: '10+', label: 'Más de 10 años' },
];

const RunnerExperienceSection = ({ experience, isEditing, onExperienceChange }: RunnerExperienceSectionProps) => {
  const getExperienceYears = () => {
    if (experience === '0-1') return [1];
    if (experience === '1-3') return [2];
    if (experience === '3-5') return [4];
    if (experience === '5-10') return [7];
    if (experience === '10+') return [15];
    return [1];
  };

  const setExperienceFromSlider = (value: number[]) => {
    const years = value[0];
    if (years <= 1) onExperienceChange('0-1');
    else if (years <= 3) onExperienceChange('1-3');
    else if (years <= 5) onExperienceChange('3-5');
    else if (years <= 10) onExperienceChange('5-10');
    else onExperienceChange('10+');
  };

  return (
    <div className="space-y-4">
      <Label>Años de experiencia corriendo</Label>
      <div className="px-3">
        <Slider
          value={getExperienceYears()}
          onValueChange={setExperienceFromSlider}
          max={30}
          min={0}
          step={1}
          disabled={!isEditing}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>0 años</span>
          <span className="font-medium text-blue-600">
            {experienceOptions.find(opt => opt.value === experience)?.label}
          </span>
          <span>30+ años</span>
        </div>
      </div>
    </div>
  );
};

export default RunnerExperienceSection;
