
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

    // Configurar el listener de cambios de autenticación PRIMERO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log('AuthProvider: Auth state change event:', {
          event,
          userId: newSession?.user?.id || 'none',
          userEmail: newSession?.user?.email || 'none',
          hasSession: !!newSession,
          initialized
        });
        
        // Actualizar estado
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Mostrar toast solo para eventos de login exitosos (no para inicialización)
        if (event === 'SIGNED_IN' && newSession?.user && initialized) {
          console.log('AuthProvider: User signed in successfully');
          toast.success('¡Sesión iniciada correctamente!');
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out');
          toast.success('Sesión cerrada correctamente');
        }
        
        // Marcar como no cargando después del primer evento
        if (loading) {
          setLoading(false);
        }
      }
    );

    // Obtener sesión inicial DESPUÉS de configurar el listener
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
        } else {
          console.log('AuthProvider: Initial session retrieved:', {
            hasSession: !!initialSession,
            userId: initialSession?.user?.id || 'none',
            userEmail: initialSession?.user?.email || 'none'
          });
          
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Exception getting initial session:', error);
      } finally {
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
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('AuthProvider: Starting signUp process for:', email);
    
    if (!email?.trim() || !password) {
      const error = { message: "Email y contraseña son requeridos" };
      console.error('AuthProvider: SignUp validation failed:', error);
      return { error };
    }

    // Configurar URL de redirect correctamente
    const redirectUrl = `${window.location.origin}/`;
    console.log('AuthProvider: Using redirect URL for signup:', redirectUrl);
    
    try {
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
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Starting signIn process for:', email);
    
    // Validación estricta
    if (!email?.trim()) {
      throw new Error('El email es requerido');
    }
    if (!password) {
      throw new Error('La contraseña es requerida');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
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
        
        // Mensajes de error específicos
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu email antes de iniciar sesión');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Demasiados intentos. Espera un momento antes de intentar de nuevo');
        } else {
          throw new Error(error.message || 'Error al iniciar sesión');
        }
      }
      
      console.log('AuthProvider: SignIn successful, auth state change will handle the rest');
      
    } catch (error) {
      console.error('AuthProvider: SignIn exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Starting signOut process');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: SignOut error:', error);
        throw error;
      }
      
      console.log('AuthProvider: SignOut successful');
    } catch (error) {
      console.error('AuthProvider: SignOut exception:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    console.log('AuthProvider: Starting password reset for:', email);
    
    if (!email?.trim()) {
      throw new Error('El email es requerido');
    }
    
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

  console.log('AuthProvider: Current state:', {
    hasUser: !!user,
    userEmail: user?.email || 'none',
    loading,
    sessionExists: !!session,
    initialized
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
