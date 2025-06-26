
import { Progress } from "@/components/ui/progress";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardProgressProps {
  currentStep: number;
  steps: Step[];
  progress: number;
}

const WizardProgress = ({ currentStep, steps, progress }: WizardProgressProps) => {
  return (
    <div className="p-6 border-b flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">
          Paso {currentStep} de {steps.length}
        </span>
        <span className="text-sm font-medium text-gray-600">
          {Math.round(progress)}% completado
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center justify-between mt-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step.id 
                ? "bg-runner-blue-600 text-white" 
                : "bg-gray-200 text-gray-600"
            }`}>
              {step.id}
            </div>
            {index < steps.length - 1 && (
              <div className={`hidden md:block w-12 h-px mx-2 ${
                currentStep > step.id ? "bg-runner-blue-600" : "bg-gray-200"
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WizardProgress;
