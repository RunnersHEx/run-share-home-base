
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

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

// Mapeo de valores de inglés a español para running_experience
const mapRunningExperience = (value: string): string => {
  const mapping: { [key: string]: string } = {
    'beginner': 'principiante',
    'intermediate': 'intermedio', 
    'advanced': 'avanzado',
    'expert': 'experto',
    'elite': 'experto' // Mapeamos elite a experto ya que no tenemos elite en español
  };
  return mapping[value] || value;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session:', session?.user?.email || 'No session');
          setUser(session?.user ?? null);
          setSession(session);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'User:', session?.user?.email || 'None');
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
        
        // Si es un nuevo usuario que se acaba de registrar o hacer login, crear/actualizar su perfil
        if (event === 'SIGNED_IN' && session?.user) {
          // Delay para asegurar que el trigger de la DB haya corrido
          setTimeout(async () => {
            try {
              const metadata = session.user.user_metadata;
              console.log('Processing user metadata:', metadata);
              
              if (metadata && Object.keys(metadata).length > 0) {
                // Preparar todos los datos del registro con mejor mapeo
                const profileData: any = {
                  first_name: metadata.firstName || metadata.first_name,
                  last_name: metadata.lastName || metadata.last_name,
                  phone: metadata.phone,
                  birth_date: metadata.birthDate || metadata.birth_date,
                  bio: metadata.bio,
                  // Mapear running_experience de inglés a español
                  running_experience: metadata.runningExperience 
                    ? mapRunningExperience(metadata.runningExperience)
                    : (metadata.running_experience 
                        ? mapRunningExperience(metadata.running_experience) 
                        : null),
                  running_modalities: metadata.runningModalities || metadata.running_modalities || [],
                  preferred_distances: metadata.preferredDistances || metadata.preferred_distances || [],
                  personal_records: metadata.personalRecords || metadata.personal_records || {},
                  races_completed_this_year: metadata.racesCompletedThisYear || metadata.races_completed_this_year || 0,
                  emergency_contact_name: metadata.emergencyContactName || metadata.emergency_contact_name,
                  emergency_contact_phone: metadata.emergencyContactPhone || metadata.emergency_contact_phone,
                  is_host: metadata.isHost !== undefined ? metadata.isHost : (metadata.is_host !== undefined ? metadata.is_host : true),
                  is_guest: metadata.isGuest !== undefined ? metadata.isGuest : (metadata.is_guest !== undefined ? metadata.is_guest : true)
                };

                console.log('Updating profile with complete data:', profileData);

                // Primero verificar si ya existe el perfil
                const { data: existingProfile } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', session.user.id)
                  .single();

                if (existingProfile) {
                  // Actualizar el perfil existente
                  const { error } = await supabase
                    .from('profiles')
                    .update(profileData)
                    .eq('id', session.user.id);

                  if (error) {
                    console.error('Error updating profile with registration data:', error);
                  } else {
                    console.log('Profile updated successfully with all registration data');
                  }
                } else {
                  // Crear nuevo perfil si no existe
                  const { error } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email,
                      ...profileData
                    });

                  if (error) {
                    console.error('Error creating profile with registration data:', error);
                  } else {
                    console.log('Profile created successfully with all registration data');
                  }
                }
              }
            } catch (error) {
              console.error('Error processing user profile after login:', error);
            }
          }, 1500);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    // Validar que email y password no estén vacíos
    if (!email || !password) {
      return { 
        error: { 
          message: "Email y contraseña son requeridos" 
        } 
      };
    }

    // Usar la URL correcta de la aplicación Lovable
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('SignUp userData being sent:', userData);
    
    // Convertir running_experience a español antes de guardar
    const mappedUserData = {
      ...userData,
      runningExperience: userData.runningExperience ? mapRunningExperience(userData.runningExperience) : null
    };
    
    // Enviar TODOS los datos del usuario en el metadata con campos más consistentes
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          // Campos principales con nombres consistentes
          firstName: mappedUserData.firstName,
          lastName: mappedUserData.lastName,
          phone: mappedUserData.phone,
          birthDate: mappedUserData.birthDate,
          bio: mappedUserData.bio,
          runningExperience: mappedUserData.runningExperience,
          runningModalities: mappedUserData.runningModalities || [],
          preferredDistances: mappedUserData.preferredDistances || [],
          personalRecords: mappedUserData.personalRecords || {},
          racesCompletedThisYear: mappedUserData.racesCompletedThisYear || 0,
          emergencyContactName: mappedUserData.emergencyContactName,
          emergencyContactPhone: mappedUserData.emergencyContactPhone,
          isHost: mappedUserData.isHost !== undefined ? mappedUserData.isHost : true,
          isGuest: mappedUserData.isGuest !== undefined ? mappedUserData.isGuest : true,
          
          // Campos alternativos para compatibilidad con base de datos
          first_name: mappedUserData.firstName,
          last_name: mappedUserData.lastName,
          birth_date: mappedUserData.birthDate,
          running_experience: mappedUserData.runningExperience,
          running_modalities: mappedUserData.runningModalities || [],
          preferred_distances: mappedUserData.preferredDistances || [],
          personal_records: mappedUserData.personalRecords || {},
          races_completed_this_year: mappedUserData.racesCompletedThisYear || 0,
          emergency_contact_name: mappedUserData.emergencyContactName,
          emergency_contact_phone: mappedUserData.emergencyContactPhone,
          is_host: mappedUserData.isHost !== undefined ? mappedUserData.isHost : true,
          is_guest: mappedUserData.isGuest !== undefined ? mappedUserData.isGuest : true
        }
      }
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting signIn for email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('AuthContext: SignIn error:', error);
      throw error;
    }
    
    console.log('AuthContext: SignIn successful for user:', data.user?.email);
  };

  const signOut = async () => {
    console.log('AuthContext: Signing out user:', user?.email);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthContext: SignOut error:', error);
      throw error;
    }
    console.log('AuthContext: SignOut successful');
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
