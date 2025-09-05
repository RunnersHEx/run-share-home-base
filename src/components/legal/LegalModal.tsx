import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LegalNotice from "./LegalNotice";
import PrivacyPolicy from "./PrivacyPolicy";
import CookiePolicy from "./CookiePolicy";
import TermsAndConditions from "./TermsAndConditions";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "legal-notice" | "privacy-policy" | "cookie-policy" | "terms-conditions";
}

const LegalModal = ({ isOpen, onClose, type }: LegalModalProps) => {

  const getTitle = () => {
    switch (type) {
      case "legal-notice":
        return "Aviso Legal";
      case "privacy-policy":
        return "Política de Privacidad";
      case "cookie-policy":
        return "Política de Cookies";
      case "terms-conditions":
        return "Términos y Condiciones";
      default:
        return "";
    }
  };

  const getContent = () => {
    switch (type) {
      case "legal-notice":
        return <LegalNotice />;
      case "privacy-policy":
        return <PrivacyPolicy />;
      case "cookie-policy":
        return <CookiePolicy />;
      case "terms-conditions":
        return <TermsAndConditions />;
      default:
        return null;
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          <div className="pb-6">
            {getContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalModal;