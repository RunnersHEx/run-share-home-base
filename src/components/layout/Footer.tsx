import { useState } from "react";
import LegalModal from "@/components/legal/LegalModal";

const Footer = () => {
  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    type: "legal-notice" | "privacy-policy" | "cookie-policy" | "terms-conditions" | null;
  }>({
    isOpen: false,
    type: null
  });

  const openLegalModal = (type: "legal-notice" | "privacy-policy" | "cookie-policy" | "terms-conditions") => {
    setLegalModal({ isOpen: true, type });
  };

  const closeLegalModal = () => {
    setLegalModal({ isOpen: false, type: null });
  };

  return (
    <>
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <p className="text-gray-400">
              Copyright © 2025 Runners Home Exchange. All rights reserved.
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-4">
              <button 
                onClick={() => openLegalModal("legal-notice")} 
                className="text-gray-300 hover:text-white hover:underline transition-colors"
              >
                Legal Notice
              </button>
              <span className="text-gray-500">|</span>
              <button 
                onClick={() => openLegalModal("privacy-policy")} 
                className="text-gray-300 hover:text-white hover:underline transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-gray-500">|</span>
              <button 
                onClick={() => openLegalModal("cookie-policy")} 
                className="text-gray-300 hover:text-white hover:underline transition-colors"
              >
                Cookie Policy
              </button>
              <span className="text-gray-500">|</span>
              <button 
                onClick={() => openLegalModal("terms-conditions")} 
                className="text-gray-300 hover:text-white hover:underline transition-colors"
              >
                Terms and Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      {legalModal.type && (
        <LegalModal 
          isOpen={legalModal.isOpen}
          onClose={closeLegalModal}
          type={legalModal.type}
        />
      )}
    </>
  );
};

export default Footer;