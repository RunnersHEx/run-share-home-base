import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Try to create a service role client for admin operations (bypasses RLS)
let supabaseServiceRole: any = null;

try {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    supabaseServiceRole = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
} catch (error) {
  console.warn('Service role client not available - admin will use regular client');
}

export const AdminStorageService = {
  // Get signed URLs for verification documents using service role (if available)
  async getVerificationDocumentUrls(documentPaths: string[]): Promise<Array<{path: string, url: string | null, error?: string}>> {
    const results = [];
    
    // Use service role client if available, otherwise fall back to regular client
    const clientToUse = supabaseServiceRole || supabase;
    const usingServiceRole = !!supabaseServiceRole;
    
    for (const docPath of documentPaths) {
      try {
        const { data, error } = await clientToUse.storage
          .from('verification-docs')
          .createSignedUrl(docPath, 3600); // 1 hour expiry

        if (error) {
          results.push({
            path: docPath,
            url: null,
            error: usingServiceRole 
              ? 'Documento no encontrado' 
              : 'Permisos de administrador requeridos - configura VITE_SUPABASE_SERVICE_ROLE_KEY'
          });
        } else {
          results.push({
            path: docPath,
            url: data.signedUrl
          });
        }
      } catch (error) {
        results.push({
          path: docPath,
          url: null,
          error: 'Error al acceder al documento'
        });
      }
    }
    
    return results;
  },

  // Check if documents exist using service role (if available)
  async checkDocumentsExist(documentPaths: string[]): Promise<{[key: string]: boolean}> {
    const results: {[key: string]: boolean} = {};
    const clientToUse = supabaseServiceRole || supabase;
    
    for (const docPath of documentPaths) {
      try {
        const { data, error } = await clientToUse.storage
          .from('verification-docs')
          .list(docPath.split('/').slice(0, -1).join('/'), {
            search: docPath.split('/').pop()
          });

        results[docPath] = !error && data && data.length > 0;
      } catch (error) {
        results[docPath] = false;
      }
    }
    
    return results;
  },

  // Get signed URLs for property images using service role (if available)
  async getPropertyImageUrls(propertyId: string): Promise<Array<{id: string, url: string | null, caption?: string, is_main?: boolean, error?: string}>> {
    const results = [];
    
    // Use service role client if available, otherwise fall back to regular client
    const clientToUse = supabaseServiceRole || supabase;
    const usingServiceRole = !!supabaseServiceRole;
    
    console.log('AdminStorageService: Starting property image fetch for property:', propertyId);
    console.log('Using service role client:', usingServiceRole);
    console.log('Service role configured:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
    
    try {
      // First get property images from database
      console.log('Fetching property images from database...');
      const { data: images, error: dbError } = await clientToUse
        .from('property_images')
        .select('id, image_url, caption, is_main, display_order')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true });

      if (dbError) {
        console.error('Database error fetching property images:', dbError);
        return [{
          id: 'db-error',
          url: null,
          error: `Error de base de datos: ${dbError.message}`
        }];
      }

      console.log('Database query result:', images);
      console.log('Images found:', images?.length || 0);

      if (!images || images.length === 0) {
        console.log('No images found in database for property:', propertyId);
        return [{
          id: 'no-images',
          url: null,
          error: 'Esta propiedad no tiene imágenes'
        }];
      }

      console.log(`Found ${images.length} images in database:`);
      images.forEach(img => console.log(`  - Image ID: ${img.id}, URL: ${img.image_url}, Main: ${img.is_main}`));

      // For each image, try to create signed URL
      for (const image of images) {
        try {
          console.log(`Processing image ${image.id} with URL: ${image.image_url}`);
          
          // If the image_url is already a complete HTTP URL, use it directly
          if (image.image_url.startsWith('http://') || image.image_url.startsWith('https://')) {
            console.log(`Using direct HTTP URL for image ${image.id}`);
            results.push({
              id: image.id,
              url: image.image_url,
              caption: image.caption,
              is_main: image.is_main
            });
            continue;
          }
          
          // If it's a storage path, try to create signed URL
          let signedUrl = null;
          let lastError = null;
          
          // Different path strategies to try
          const pathVariations = [
            image.image_url, // Original path
            image.image_url.startsWith('/') ? image.image_url.slice(1) : image.image_url, // Remove leading slash
            `properties/${propertyId}/${image.image_url.split('/').pop()}`, // Property folder structure
            `property-images/${image.image_url.split('/').pop()}`, // Property images folder
            `${propertyId}/${image.image_url.split('/').pop()}`, // Just property ID folder
            image.image_url.split('/').pop(), // Just filename
          ];
          
          // Try different bucket names
          const bucketVariations = ['property-images', 'properties', 'images', 'uploads'];
          
          for (const bucket of bucketVariations) {
            for (const path of pathVariations) {
              try {
                const { data, error } = await clientToUse.storage
                  .from(bucket)
                  .createSignedUrl(path, 3600); // 1 hour expiry
                
                if (!error && data?.signedUrl) {
                  console.log(`Successfully created signed URL for image ${image.id} using bucket: ${bucket}, path: ${path}`);
                  signedUrl = data.signedUrl;
                  break;
                } else {
                  lastError = error;
                }
              } catch (err) {
                lastError = err;
              }
            }
            if (signedUrl) break;
          }
          
          if (signedUrl) {
            results.push({
              id: image.id,
              url: signedUrl,
              caption: image.caption,
              is_main: image.is_main
            });
          } else {
            console.error(`Failed to create signed URL for image ${image.id}. Last error:`, lastError);
            results.push({
              id: image.id,
              url: null,
              caption: image.caption,
              is_main: image.is_main,
              error: usingServiceRole 
                ? 'Imagen no encontrada en el almacenamiento' 
                : 'Permisos de administrador requeridos - configura VITE_SUPABASE_SERVICE_ROLE_KEY'
            });
          }
        } catch (error) {
          console.error('Error processing image:', image.id, error);
          results.push({
            id: image.id,
            url: null,
            caption: image.caption,
            is_main: image.is_main,
            error: 'Error al procesar la imagen'
          });
        }
      }
      
      console.log(`Final results: ${results.length} processed, ${results.filter(r => r.url).length} successful`);
      
    } catch (error) {
      console.error('Error in getPropertyImageUrls:', error);
      results.push({
        id: 'error',
        url: null,
        error: 'Error inesperado al obtener imágenes'
      });
    }
    
    return results;
  },

  // Check if service role is configured
  isServiceRoleAvailable(): boolean {
    return !!supabaseServiceRole;
  }
};
