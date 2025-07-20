
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Enhanced user type that includes profile data
interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_host: boolean;
  is_guest: boolean;
  verification_status: string;
  points_balance: number;
  total_host_experiences: number;
  total_guest_experiences: number;
  average_rating: number;
  profile_image_url?: string;
  bio?: string;
  running_experience?: string;
  // ... other profile fields as needed
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null; // ✅ NEW: Profile data with business logic
  session: Session | null;
  loading: boolean;
  profileLoading: boolean; // ✅ NEW: Separate loading state for profile
  
  // Helper methods for business logic
  canHost: boolean; // ✅ NEW: Computed property
  canGuest: boolean; // ✅ NEW: Computed property
  isVerified: boolean; // ✅ NEW: Computed property
  
  // Existing methods
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // ✅ NEW: Profile management methods
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ✅ Computed properties based on profile data (safe when profile is null) - FIXED
  const canHost = profile?.is_host ?? true; // Allow hosting if profile is null or is_host is true
  const canGuest = profile?.is_guest ?? true; // Allow guest mode if profile is null or is_guest is true
  const isVerified = profile?.verification_status === 'verified' || profile?.verification_status === 'approved'; // Verified if status is 'verified' or 'approved'

  // ✅ Load profile data when user changes
  const loadUserProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      logger.debug('AuthProvider: Loading profile for user:', userId);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.warn('AuthProvider: Profile not found or error loading profile:', error);
        
        // Check if it's a permission error vs profile not found
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - this is expected for some users
          logger.info('AuthProvider: Profile does not exist yet, user can still authenticate');
        } else if (error.message?.includes('permission')) {
          // RLS policy issue
          logger.error('AuthProvider: Permission denied accessing profile:', error);
        }
        
        // Set a minimal profile to allow app functionality
        setProfile({
          id: userId,
          email: '', // Will be filled from auth user
          is_host: true,
          is_guest: true, 
          verification_status: 'unverified',
          points_balance: 0,
          total_host_experiences: 0,
          total_guest_experiences: 0,
          average_rating: 0
        });
        return;
      }

      logger.debug('AuthProvider: Profile loaded successfully:', {
        userId: profileData.id,
        isHost: profileData.is_host,
        isGuest: profileData.is_guest,
        verificationStatus: profileData.verification_status
      });

      setProfile(profileData);
    } catch (error) {
      logger.error('AuthProvider: Exception loading profile:', error);
      // Set fallback profile even on exception
      setProfile({
        id: userId,
        email: '',
        is_host: true,
        is_guest: true,
        verification_status: 'unverified',
        points_balance: 0,
        total_host_experiences: 0,
        total_guest_experiences: 0,
        average_rating: 0
      });
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    logger.debug('AuthProvider: Initializing auth system');
    
    let mounted = true;

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        logger.debug('AuthProvider: Auth state change:', {
          event,
          userId: newSession?.user?.id || 'none',
          userEmail: newSession?.user?.email || 'none',
          hasSession: !!newSession
        });
        
        // Update auth state immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Load profile data if user exists (don't block main loading)
        if (newSession?.user) {
          loadUserProfile(newSession.user.id).catch(error => {
            logger.warn('AuthProvider: Profile loading failed, continuing anyway:', error);
          });
        } else {
          setProfile(null);
        }
        
        if (initialized) {
          setLoading(false);
        }
        
        // Show toasts after initialization
        if (initialized && mounted) {
          if (event === 'SIGNED_IN' && newSession?.user) {
            logger.info('AuthProvider: User signed in successfully');
            toast.success('¡Sesión iniciada correctamente!');
          } else if (event === 'SIGNED_OUT') {
            logger.info('AuthProvider: User signed out');
            toast.success('Sesión cerrada correctamente');
          }
        }
      }
    );

    // Obtener sesión inicial DESPUÉS del listener
    const initializeAuth = async () => {
      try {
        logger.debug('AuthProvider: Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('AuthProvider: Error getting initial session:', error);
        }
        
        if (mounted) {
          logger.debug('AuthProvider: Initial session retrieved:', {
            hasSession: !!initialSession,
            userId: initialSession?.user?.id || 'none'
          });
          
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Load profile if user exists (don't block initialization)
          if (initialSession?.user) {
            loadUserProfile(initialSession.user.id).catch(error => {
              logger.warn('AuthProvider: Initial profile loading failed, continuing anyway:', error);
            });
          }
          
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        logger.error('AuthProvider: Exception getting initial session:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      logger.debug('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [initialized]);

  const signUp = async (email: string, password: string, userData: any) => {
    logger.debug('AuthProvider: Starting signUp for:', email);
    
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

      logger.debug('AuthProvider: SignUp response:', {
        success: !error,
        userId: data.user?.id || 'none',
        confirmed: !!data.user?.email_confirmed_at
      });

      return { error };
    } catch (error: any) {
      logger.error('AuthProvider: SignUp exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    logger.debug('AuthProvider: Starting signIn for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      logger.debug('AuthProvider: SignIn response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        errorMessage: error?.message || 'none'
      });

      if (error) {
        logger.error('AuthProvider: SignIn error:', error);
        
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
        logger.error('AuthProvider: Login successful but no user/session data returned');
        throw new Error('Error de autenticación: datos incompletos');
      }
      
      logger.info('AuthProvider: SignIn successful for user:', data.user.id);
      
    } catch (error: any) {
      logger.error('AuthProvider: SignIn exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    logger.debug('AuthProvider: Starting signOut');
    
    try {
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('AuthProvider: SignOut error:', error);
        throw error;
      }
      
      logger.info('AuthProvider: SignOut successful');
      
      // Forzar recarga de la página para limpiar todo el estado
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      logger.error('AuthProvider: SignOut exception:', error);
      // Still clear local state even if error
      setUser(null);
      setProfile(null);
      setSession(null);
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    logger.debug('AuthProvider: Starting password reset for:', email);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        logger.error('AuthProvider: Reset password error:', error);
        throw error;
      }
      
      logger.info('AuthProvider: Reset password email sent successfully');
    } catch (error) {
      logger.error('AuthProvider: Reset password exception:', error);
      throw error;
    }
  };

  // ✅ NEW: Update profile method
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

    try {
      setProfileLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        logger.error('AuthProvider: Error updating profile:', error);
        return false;
      }

      // Refresh profile data
      await loadUserProfile(user.id);
      logger.info('AuthProvider: Profile updated successfully');
      return true;
    } catch (error) {
      logger.error('AuthProvider: Exception updating profile:', error);
      return false;
    } finally {
      setProfileLoading(false);
    }
  };

  // ✅ NEW: Refresh profile method
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    await loadUserProfile(user.id);
  };

  // ✅ DEBUG: Force loading to complete after 5 seconds max
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !initialized) {
        console.warn('AuthProvider: Forcing loading to complete after timeout');
        setLoading(false);
        setInitialized(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [loading, initialized]);

  // ✅ Force loading to false if initialized (prevent stuck loading)
  const finalLoading = initialized ? false : loading;

  const value = {
    user,
    profile,
    session,
    loading: finalLoading, // ✅ Use the forced loading state
    profileLoading,
    canHost,
    canGuest,
    isVerified,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  logger.debug('AuthProvider: Current enhanced state render:', {
    hasUser: !!user,
    hasProfile: !!profile,
    userEmail: user?.email || 'none',
    isHost: profile?.is_host || false,
    isGuest: profile?.is_guest || false,
    canHost,
    canGuest,
    loading: finalLoading,
    profileLoading,
    initialized,
    sessionExists: !!session
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ Enhanced useAuth hook with better typing
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ Convenience hooks for common checks
export const useCanHost = () => {
  const { canHost } = useAuth();
  return canHost;
};

export const useCanGuest = () => {
  const { canGuest } = useAuth();
  return canGuest;
};

export const useIsVerified = () => {
  const { isVerified } = useAuth();
  return isVerified;
};
