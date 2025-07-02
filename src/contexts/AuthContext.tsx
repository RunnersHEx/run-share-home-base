
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth system');
    
    let mounted = true;

    // Configurar listener PRIMERO antes de obtener sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        console.log('AuthProvider: Auth state change:', {
          event,
          userId: newSession?.user?.id || 'none',
          userEmail: newSession?.user?.email || 'none',
          hasSession: !!newSession
        });
        
        // Actualizar estado inmediatamente
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (initialized) {
          setLoading(false);
        }
        
        // Solo mostrar toasts después de inicialización
        if (initialized && mounted) {
          if (event === 'SIGNED_IN' && newSession?.user) {
            console.log('AuthProvider: User signed in successfully');
            toast.success('¡Sesión iniciada correctamente!');
          } else if (event === 'SIGNED_OUT') {
            console.log('AuthProvider: User signed out');
            toast.success('Sesión cerrada correctamente');
          }
        }
      }
    );

    // Obtener sesión inicial DESPUÉS del listener
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
        }
        
        if (mounted) {
          console.log('AuthProvider: Initial session retrieved:', {
            hasSession: !!initialSession,
            userId: initialSession?.user?.id || 'none'
          });
          
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('AuthProvider: Exception getting initial session:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [initialized]);

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('AuthProvider: Starting signUp for:', email);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
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
        confirmed: !!data.user?.email_confirmed_at
      });

      return { error };
    } catch (error: any) {
      console.error('AuthProvider: SignUp exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Starting signIn for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      console.log('AuthProvider: SignIn response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        errorMessage: error?.message || 'none'
      });

      if (error) {
        console.error('AuthProvider: SignIn error:', error);
        
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('invalid_credentials') ||
            error.message?.includes('Email not confirmed')) {
          errorMessage = 'Email o contraseña incorrectos. Verifica tus credenciales.';
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Espera un momento antes de intentar de nuevo';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (!data?.user || !data?.session) {
        console.error('AuthProvider: Login successful but no user/session data returned');
        throw new Error('Error de autenticación: datos incompletos');
      }
      
      console.log('AuthProvider: SignIn successful for user:', data.user.id);
      
    } catch (error: any) {
      console.error('AuthProvider: SignIn exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Starting signOut');
    
    try {
      // Limpiar estado local inmediatamente
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: SignOut error:', error);
        throw error;
      }
      
      console.log('AuthProvider: SignOut successful');
      
      // Forzar recarga de la página para limpiar todo el estado
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('AuthProvider: SignOut exception:', error);
      // Aún si hay error, limpiar estado local
      setUser(null);
      setSession(null);
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    console.log('AuthProvider: Starting password reset for:', email);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('AuthProvider: Reset password error:', error);
        throw error;
      }
      
      console.log('AuthProvider: Reset password email sent successfully');
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

  console.log('AuthProvider: Current state render:', {
    hasUser: !!user,
    userEmail: user?.email || 'none',
    loading,
    initialized,
    sessionExists: !!session
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
