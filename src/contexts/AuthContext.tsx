
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownLoginToast, setHasShownLoginToast] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    let mounted = true;

    // Configurar el listener PRIMERO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log('AuthProvider: Auth state changed:', {
          event,
          userId: newSession?.user?.id || 'none',
          userEmail: newSession?.user?.email || 'none',
          hasSession: !!newSession
        });
        
        // Actualizar estado inmediatamente
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Mostrar toast solo para eventos de login manuales (no para inicialización)
        if (event === 'SIGNED_IN' && newSession?.user && !hasShownLoginToast) {
          console.log('AuthProvider: Showing login success toast');
          toast.success('¡Sesión iniciada correctamente!');
          setHasShownLoginToast(true);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out');
          setHasShownLoginToast(false);
        }
        
        // Finalizar loading después de procesar el evento
        setLoading(false);
      }
    );

    // Obtener sesión inicial DESPUÉS de configurar el listener
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
        } else {
          console.log('AuthProvider: Initial session:', {
            hasSession: !!session,
            userId: session?.user?.id || 'none',
            userEmail: session?.user?.email || 'none'
          });
          
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Exception getting initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [hasShownLoginToast]);

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('AuthProvider: Starting signUp for:', email);
    
    if (!email?.trim() || !password) {
      const error = { message: "Email y contraseña son requeridos" };
      console.error('AuthProvider: SignUp validation error:', error);
      return { error };
    }

    const redirectUrl = `${window.location.origin}/`;
    console.log('AuthProvider: Using redirect URL:', redirectUrl);
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            birth_date: userData.birthDate,
            bio: userData.bio,
            running_experience: userData.runningExperience,
            running_modalities: userData.runningModalities,
            preferred_distances: userData.preferredDistances,
            personal_records: userData.personalRecords,
            races_completed_this_year: userData.racesCompletedThisYear,
            emergency_contact_name: userData.emergencyContactName,
            emergency_contact_phone: userData.emergencyContactPhone,
            is_host: userData.isHost,
            is_guest: userData.isGuest
          }
        }
      });

      console.log('AuthProvider: SignUp response:', {
        success: !error,
        userId: data.user?.id || 'none',
        email: data.user?.email || 'none',
        confirmed: !!data.user?.email_confirmed_at,
        error: error?.message || 'none'
      });

      return { error };
    } catch (error: any) {
      console.error('AuthProvider: SignUp exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Starting signIn for:', email);
    
    if (!email?.trim() || !password) {
      const error = new Error('Email y contraseña son requeridos');
      console.error('AuthProvider: SignIn validation error:', error);
      throw error;
    }
    
    try {
      setLoading(true);
      setHasShownLoginToast(false); // Reset para permitir toast en el próximo login
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      console.log('AuthProvider: SignIn response:', {
        success: !error,
        userId: data.user?.id || 'none',
        email: data.user?.email || 'none',
        hasSession: !!data.session,
        error: error?.message || 'none'
      });

      if (error) {
        console.error('AuthProvider: SignIn error:', error);
        throw error;
      }
      
      console.log('AuthProvider: SignIn successful - auth state change will be handled by listener');
      
    } catch (error) {
      console.error('AuthProvider: SignIn exception:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Starting signOut');
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: SignOut error:', error);
        throw error;
      }
      
      console.log('AuthProvider: SignOut successful');
    } catch (error) {
      console.error('AuthProvider: SignOut exception:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log('AuthProvider: Starting password reset for:', email);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('AuthProvider: Reset password error:', error);
        throw error;
      }
      
      console.log('AuthProvider: Reset password successful');
    } catch (error) {
      console.error('AuthProvider: Reset password exception:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  console.log('AuthProvider: Rendering with state:', {
    hasUser: !!user,
    userEmail: user?.email || 'none',
    loading,
    sessionExists: !!session
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
