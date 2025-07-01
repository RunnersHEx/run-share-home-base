
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAdminAuth = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('useAdminAuth: No user found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Verificar si el email del usuario es el email de admin
        const adminEmail = 'runnershomeexchange@gmail.com';
        const userIsAdmin = user.email === adminEmail;
        
        console.log('useAdminAuth: Checking admin status for:', user.email);
        console.log('useAdminAuth: Admin email:', adminEmail);
        console.log('useAdminAuth: Is admin?', userIsAdmin);
        
        setIsAdmin(userIsAdmin);
      } catch (error) {
        console.error('useAdminAuth: Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};
