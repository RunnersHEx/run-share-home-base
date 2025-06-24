
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
          // Pequeño delay para asegurar que el trigger de la DB haya corrido
          setTimeout(async () => {
            try {
              // Verificar si el perfil ya existe y actualizarlo con los datos completos
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (existingProfile) {
                // Actualizar con datos completos del metadata si están disponibles
                const metadata = session.user.user_metadata;
                if (metadata && Object.keys(metadata).length > 0) {
                  const updateData: any = {};
                  
                  // Mapear todos los campos del metadata al perfil
                  if (metadata.first_name) updateData.first_name = metadata.first_name;
                  if (metadata.last_name) updateData.last_name = metadata.last_name;
                  if (metadata.phone) updateData.phone = metadata.phone;
                  if (metadata.birth_date) updateData.birth_date = metadata.birth_date;
                  if (metadata.bio) updateData.bio = metadata.bio;
                  if (metadata.running_experience) updateData.running_experience = metadata.running_experience;
                  if (metadata.running_modalities) updateData.running_modalities = metadata.running_modalities;
                  if (metadata.preferred_distances) updateData.preferred_distances = metadata.preferred_distances;
                  if (metadata.personal_records) updateData.personal_records = metadata.personal_records;
                  if (metadata.races_completed_this_year) updateData.races_completed_this_year = metadata.races_completed_this_year;
                  if (metadata.emergency_contact_name) updateData.emergency_contact_name = metadata.emergency_contact_name;
                  if (metadata.emergency_contact_phone) updateData.emergency_contact_phone = metadata.emergency_contact_phone;
                  if (metadata.is_host !== undefined) updateData.is_host = metadata.is_host;
                  if (metadata.is_guest !== undefined) updateData.is_guest = metadata.is_guest;

                  if (Object.keys(updateData).length > 0) {
                    const { error } = await supabase
                      .from('profiles')
                      .update(updateData)
                      .eq('id', session.user.id);

                    if (error) {
                      console.error('Error updating profile with registration data:', error);
                    } else {
                      console.log('Profile updated successfully with registration data');
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error processing user profile after login:', error);
            }
          }, 1000);
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
    
    const { error } = await supabase.auth.signUp({
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
          running_modalities: userData.runningModalities || [],
          preferred_distances: userData.preferredDistances || [],
          personal_records: userData.personalRecords || {},
          races_completed_this_year: userData.racesCompletedThisYear || 0,
          emergency_contact_name: userData.emergencyContactName,
          emergency_contact_phone: userData.emergencyContactPhone,
          is_host: userData.isHost,
          is_guest: userData.isGuest
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
