
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (authLoading) {
        console.log('useAdminAuth: Auth still loading');
        return;
      }

      if (!user) {
        console.log('useAdminAuth: No user found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Verificar si el email del usuario es el email de admin
      const adminEmail = 'runnershomeexchange@gmail.com';
      const userIsAdmin = user.email === adminEmail;
      
      console.log('useAdminAuth: Checking admin status for:', user.email);
      console.log('useAdminAuth: Admin email:', adminEmail);
      console.log('useAdminAuth: Is admin?', userIsAdmin);
      
      setIsAdmin(userIsAdmin);
      setLoading(false);
    };

    checkAdminStatus();
  }, [user, authLoading]);

  return { isAdmin, loading };
};
