
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
    console.log('AuthProvider: Setting up auth state listener');
    
    // Get initial session first
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
        } else {
          console.log('AuthProvider: Initial session loaded:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('AuthProvider: Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthProvider: Auth state changed:', event, 'User:', newSession?.user?.email || 'None');
        
        // Update state immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        
        // Handle different auth events
        if (event === 'SIGNED_IN' && newSession?.user) {
          console.log('AuthProvider: User signed in successfully');
          // Force a small delay to ensure UI updates
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out');
        }
      }
    );

    getInitialSession();

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('AuthProvider: Starting signUp for:', email);
    
    if (!email || !password) {
      return { 
        error: { 
          message: "Email y contraseña son requeridos" 
        } 
      };
    }

    const redirectUrl = `${window.location.origin}/`;
    console.log('AuthProvider: Using redirect URL:', redirectUrl);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
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

      if (error) {
        console.error('AuthProvider: SignUp error:', error);
        return { error };
      }

      console.log('AuthProvider: SignUp successful:', data.user?.email);
      
      // If user is immediately confirmed (no email verification required)
      if (data.user && !data.user.email_confirmed_at) {
        console.log('AuthProvider: User needs email confirmation');
      } else if (data.user && data.user.email_confirmed_at) {
        console.log('AuthProvider: User confirmed immediately');
      }

      return { error: null };
    } catch (error) {
      console.error('AuthProvider: SignUp exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Starting signIn for:', email);
    
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('AuthProvider: SignIn error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('AuthProvider: SignIn successful for:', data.user.email);
        // Don't manually set state here, let onAuthStateChange handle it
      }
    } catch (error) {
      console.error('AuthProvider: SignIn exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Starting signOut');
    
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
