
import { useState, useEffect, createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Si es un nuevo usuario que se acaba de registrar, crear/actualizar su perfil
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
                  running_experience: metadata.runningExperience || metadata.running_experience,
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
          }, 1500); // Increased delay to ensure DB trigger completes
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
    
    // Enviar TODOS los datos del usuario en el metadata con campos más consistentes
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          // Campos principales con nombres consistentes
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          birthDate: userData.birthDate,
          bio: userData.bio,
          runningExperience: userData.runningExperience,
          runningModalities: userData.runningModalities || [],
          preferredDistances: userData.preferredDistances || [],
          personalRecords: userData.personalRecords || {},
          racesCompletedThisYear: userData.racesCompletedThisYear || 0,
          emergencyContactName: userData.emergencyContactName,
          emergencyContactPhone: userData.emergencyContactPhone,
          isHost: userData.isHost !== undefined ? userData.isHost : true,
          isGuest: userData.isGuest !== undefined ? userData.isGuest : true,
          
          // Campos alternativos para compatibilidad con base de datos
          first_name: userData.firstName,
          last_name: userData.lastName,
          birth_date: userData.birthDate,
          running_experience: userData.runningExperience,
          running_modalities: userData.runningModalities || [],
          preferred_distances: userData.preferredDistances || [],
          personal_records: userData.personalRecords || {},
          races_completed_this_year: userData.racesCompletedThisYear || 0,
          emergency_contact_name: userData.emergencyContactName,
          emergency_contact_phone: userData.emergencyContactPhone,
          is_host: userData.isHost !== undefined ? userData.isHost : true,
          is_guest: userData.isGuest !== undefined ? userData.isGuest : true
        }
      }
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
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

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
