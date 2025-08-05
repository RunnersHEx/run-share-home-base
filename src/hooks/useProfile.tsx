
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanFormData } from "@/utils/dateUtils";
import { Profile } from "@/types/profile";

export const useProfile = () => {
  const { user, refreshProfile: refreshAuthProfile } = useAuth();
  const mountedRef = useRef(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const calculateProgress = (profileData: Profile) => {
    let completed = 0;
    const totalFields = 10;

    if (profileData.first_name) completed++;
    if (profileData.last_name) completed++;
    if (profileData.phone) completed++;
    if (profileData.bio) completed++;
    if (profileData.running_experience) completed++;
    if (profileData.preferred_distances && profileData.preferred_distances.length > 0) completed++;
    if (profileData.emergency_contact_name) completed++;
    if (profileData.emergency_contact_phone) completed++;
    if (profileData.is_host || profileData.is_guest) completed++;
    if (profileData.profile_image_url) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  const fetchProfile = async () => {
    console.log('useProfile: fetchProfile called', {
      hasUser: !!user,
      userId: user?.id,
      mounted: mountedRef.current
    });
    
    if (!user || !mountedRef.current) {
      console.log('useProfile: Exiting fetchProfile - no user or not mounted');
      return;
    }

    try {
      console.log('useProfile: Starting profile fetch for user:', user.id);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('useProfile: Supabase query completed', {
        hasData: !!data,
        hasError: !!error,
        mounted: mountedRef.current
      });

      if (!mountedRef.current) {
        console.log('useProfile: Component unmounted during fetch, returning');
        return;
      }

      if (error) {
        console.error('useProfile: Supabase error fetching profile:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details
        });
        
        // Don't create fallback profile - let ProfileLayout handle the fallback
        console.log('useProfile: Setting profile to null due to error - ProfileLayout will handle fallback');
        setProfile(null);
        setProgress(0);
        return;
      }
      
      console.log('useProfile: Profile data fetched successfully:', data);
      
      // Cast the data to include our extended fields
      const extendedData = data as any;
      console.log('useProfile: Raw verification_status from DB:', extendedData.verification_status);
      
      // Ensure all required fields are present with proper defaults
      const profileData: Profile = {
        id: extendedData.id,
        email: extendedData.email || user.email || null,
        first_name: extendedData.first_name || null,
        last_name: extendedData.last_name || null,
        phone: extendedData.phone || null,
        birth_date: extendedData.birth_date || null,
        bio: extendedData.bio || null,
        running_experience: extendedData.running_experience || null,
        preferred_distances: extendedData.preferred_distances || [],
        running_modalities: extendedData.running_modalities || [],
        personal_records: extendedData.personal_records || {},
        races_completed_this_year: extendedData.races_completed_this_year || 0,
        emergency_contact_name: extendedData.emergency_contact_name || null,
        emergency_contact_phone: extendedData.emergency_contact_phone || null,
        is_host: extendedData.is_host || false,
        is_guest: extendedData.is_guest || false,
        verification_status: extendedData.verification_status || 'pending',
        verification_documents: extendedData.verification_documents || [],
        total_host_experiences: extendedData.total_host_experiences || 0,
        total_guest_experiences: extendedData.total_guest_experiences || 0,
        average_rating: extendedData.average_rating || 0,
        badges: extendedData.badges || [],
        points_balance: extendedData.points_balance || 0,
        profile_image_url: extendedData.profile_image_url || null
      };
      
      console.log('useProfile: Processed verification_status:', profileData.verification_status);
      console.log('useProfile: Complete profileData:', profileData);
      
      if (mountedRef.current) {
        console.log('useProfile: Setting profile state and calculating progress');
        setProfile(profileData);

        // Calculate progress using frontend logic
        const calculatedProgress = calculateProgress(profileData);
        setProgress(calculatedProgress);
        console.log('useProfile: Profile state updated successfully', {
          profileId: profileData.id,
          verificationStatus: profileData.verification_status,
          progress: calculatedProgress
        });
      }
    } catch (error) {
      console.error('useProfile: Exception in fetchProfile:', error);
      if (mountedRef.current) {
        // Don't show toast for expected errors like missing profile
        console.log('useProfile: Setting loading to false due to error');
      }
    } finally {
      if (mountedRef.current) {
        console.log('useProfile: Setting loading to false');
        setLoading(false);
      }
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !mountedRef.current) return false;

    try {
      console.log('Updating profile with:', updates);
      
      // Use the utility function to clean the data
      const cleanUpdates = cleanFormData(updates);
      
      // Filter to only include valid profile fields
      const validFields = [
        'running_experience', 'preferred_distances', 'running_modalities', 
        'personal_records', 'races_completed_this_year', 'bio', 'is_host', 
        'is_guest', 'verification_status', 'verification_documents', 
        'profile_image_url', 'first_name', 'last_name', 'phone', 
        'birth_date', 'emergency_contact_name', 'emergency_contact_phone'
      ];
      
      const filteredUpdates: any = {};
      Object.keys(cleanUpdates).forEach(key => {
        if (validFields.includes(key)) {
          filteredUpdates[key] = cleanUpdates[key];
        } else {
          console.log('Skipping unknown field:', key);
        }
      });

      console.log('Clean updates to send:', filteredUpdates);
      
      // Validate array fields to ensure they're arrays
      if (filteredUpdates.preferred_distances && !Array.isArray(filteredUpdates.preferred_distances)) {
        console.warn('preferred_distances is not an array, converting:', filteredUpdates.preferred_distances);
        filteredUpdates.preferred_distances = [];
      }
      if (filteredUpdates.running_modalities && !Array.isArray(filteredUpdates.running_modalities)) {
        console.warn('running_modalities is not an array, converting:', filteredUpdates.running_modalities);
        filteredUpdates.running_modalities = [];
      }
      if (filteredUpdates.verification_documents && !Array.isArray(filteredUpdates.verification_documents)) {
        console.warn('verification_documents is not an array, converting:', filteredUpdates.verification_documents);
        filteredUpdates.verification_documents = [];
      }
      if (filteredUpdates.badges && !Array.isArray(filteredUpdates.badges)) {
        console.warn('badges is not an array, converting:', filteredUpdates.badges);
        filteredUpdates.badges = [];
      }
      
      // Validate personal_records to ensure it's an object
      if (filteredUpdates.personal_records && typeof filteredUpdates.personal_records !== 'object') {
        console.warn('personal_records is not an object, converting:', filteredUpdates.personal_records);
        filteredUpdates.personal_records = {};
      }
      
      console.log('Final validated updates:', filteredUpdates);

      const { error } = await supabase
        .from('profiles')
        .update(filteredUpdates)
        .eq('id', user.id);

      if (!mountedRef.current) return false;

      if (error) {
        console.error('Database error updating profile:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          updatesAttempted: filteredUpdates,
          userId: user.id
        });
        
        // Provide user-friendly error messages based on error type
        let userMessage = 'Error al actualizar el perfil';
        if (error.code === '23514') {
          userMessage = 'Algunos valores no son válidos. Por favor, revisa los campos.';
        } else if (error.code === '23505') {
          userMessage = 'Ya existe un registro con esos datos.';
        } else if (error.code === '42501') {
          userMessage = 'No tienes permisos para realizar esta operación.';
        }
        
        toast.error(userMessage);
        throw error;
      }

      // Update local state
      if (mountedRef.current) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        
        // Recalculate progress using frontend logic
        if (profile) {
          const updatedProfile = { ...profile, ...updates };
          const calculatedProgress = calculateProgress(updatedProfile);
          setProgress(calculatedProgress);
        }

        // ✅ SYNC FIX: Also refresh the AuthContext profile
        if (refreshAuthProfile) {
          console.log('useProfile: Syncing AuthContext after profile update');
          refreshAuthProfile().catch(error => {
            console.warn('useProfile: Failed to refresh AuthContext profile:', error);
          });
        }

        toast.success('Perfil actualizado correctamente');
      }
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      if (mountedRef.current) {
        toast.error('Error al actualizar el perfil');
      }
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user || !mountedRef.current) {
      console.log('uploadAvatar: No user or component unmounted');
      return null;
    }

    try {
      console.log('uploadAvatar: Starting upload process', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: user.id
      });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      console.log('uploadAvatar: Generated filename:', fileName);

      // First, try to remove any existing avatar
      console.log('uploadAvatar: Removing existing avatar if any...');
      await supabase.storage
        .from('avatars')
        .remove([fileName]);

      // Upload new avatar
      console.log('uploadAvatar: Uploading to Supabase storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        });

      if (!mountedRef.current) {
        console.log('uploadAvatar: Component unmounted during upload');
        return null;
      }

      if (uploadError) {
        console.error('uploadAvatar: Upload error:', uploadError);
        throw uploadError;
      }

      console.log('uploadAvatar: Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('uploadAvatar: Generated public URL:', publicUrl);

      // Add cache busting parameter to force reload
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      console.log('uploadAvatar: URL with cache buster:', urlWithCacheBuster);

      // Update the profile with the new URL
      console.log('uploadAvatar: Updating profile with new image URL...');
      const success = await updateProfile({ profile_image_url: urlWithCacheBuster });
      
      if (success && mountedRef.current) {
        console.log('uploadAvatar: Profile updated successfully');
        return urlWithCacheBuster;
      } else {
        console.error('uploadAvatar: Failed to update profile with new image URL');
        return null;
      }
      
    } catch (error) {
      console.error('uploadAvatar: Exception during upload:', error);
      if (mountedRef.current) {
        toast.error(`Error al subir la foto de perfil: ${error.message}`);
      }
      return null;
    }
  };

  const uploadVerificationDoc = async (file: File, docType: string) => {
    if (!user || !mountedRef.current) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file);

      if (!mountedRef.current) return null;

      if (uploadError) throw uploadError;

      const currentDocs = profile?.verification_documents || [];
      
      // Remover documento anterior del mismo tipo
      const filteredDocs = currentDocs.filter(doc => !doc.includes(docType));
      const newDocs = [...filteredDocs, fileName];
      
      const success = await updateProfile({ verification_documents: newDocs });
      
      // ✅ SYNC FIX: Also refresh AuthContext after verification doc upload
      if (success && refreshAuthProfile) {
        setTimeout(() => {
          refreshAuthProfile().catch(error => {
            console.warn('uploadVerificationDoc: Failed to refresh AuthContext profile:', error);
          });
        }, 500);
      }
      
      return success ? fileName : null;
    } catch (error) {
      console.error('Error uploading verification document:', error);
      if (mountedRef.current) {
        toast.error('Error al subir el documento de verificación');
      }
      return null;
    }
  };

  useEffect(() => {
    console.log('useProfile: useEffect triggered', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      mounted: mountedRef.current
    });
    
    mountedRef.current = true;
    
    if (user) {
      console.log('useProfile: User available, calling fetchProfile');
      fetchProfile();
    } else {
      console.log('useProfile: No user available, skipping fetchProfile');
      setLoading(false);
    }
    
    return () => {
      console.log('useProfile: Cleaning up useEffect');
      mountedRef.current = false;
    };
  }, [user]);

  return {
  profile,
  loading,
  progress,
  updateProfile,
  uploadAvatar,
  uploadVerificationDoc,
  refetchProfile: fetchProfile,
    // ✅ SYNC FIX: Provide access to AuthContext refresh
      refreshAuthProfile
    };
};
