
import { Check, X } from "lucide-react";

interface PasswordValidationIndicatorProps {
  password: string;
}

const PasswordValidationIndicator = ({ password }: PasswordValidationIndicatorProps) => {
  const validations = {
    minLength: password.length >= 8,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password)
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={`flex items-center text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
      {isValid ? (
        <Check className="h-3 w-3 mr-2" />
      ) : (
        <X className="h-3 w-3 mr-2" />
      )}
      {text}
    </div>
  );

  return (
    <div className="mt-2 space-y-1">
      <ValidationItem isValid={validations.minLength} text="Mínimo 8 caracteres" />
      <ValidationItem isValid={validations.hasSpecialChar} text="1 carácter especial (!@#$%^&*)" />
      <ValidationItem isValid={validations.hasUppercase} text="Una mayúscula" />
      <ValidationItem isValid={validations.hasNumber} text="Un número" />
    </div>
  );
};

export default PasswordValidationIndicator;
