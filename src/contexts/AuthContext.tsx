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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    let sessionSet = false;  // Flag para evitar duplicación

    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('AuthProvider: Auth state changed:', {
          event,
          userId: newSession?.user?.id || 'none',
          userEmail: newSession?.user?.email || 'none'
        });
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        sessionSet = true;  // Marcar que la sesión ya fue establecida
        
        // Solo mostrar toast de éxito si es un login manual (no una restauración de sesión)
        if (event === 'SIGNED_IN' && newSession?.user && !sessionSet) {
          console.log('AuthProvider: User signed in successfully');
          // No mostrar toast aquí - se maneja en el componente de login
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out');
        }
      }
    );

    // THEN get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
          setLoading(false);
        } else {
          console.log('AuthProvider: Initial session:', {
            hasSession: !!session,
            userId: session?.user?.id || 'none',
            userEmail: session?.user?.email || 'none'
          });
          
          // Solo establecer si hay sesión Y no se ha establecido ya por el listener
          if (session && !sessionSet) {
            setSession(session);
            setUser(session?.user ?? null);
          }
          
          // Siempre establecer loading en false
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider: Exception getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

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

      if (error) {
        console.error('AuthProvider: SignUp error:', error);
        return { error };
      }

      return { error: null };
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
      
      console.log('AuthProvider: SignIn successful');
      // Auth state change will be handled by the listener
      // Show success toast here since login was manual
      toast.success('¡Sesión iniciada correctamente!');
      
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
      // Auth state change will be handled by the listener
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
