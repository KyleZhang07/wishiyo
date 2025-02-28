
import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize Supabase resources needed by the application
 */
export const initializeSupabaseResources = async (): Promise<void> => {
  try {
    // Check if the storage bucket exists and create it if it doesn't
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      return;
    }
    
    const storageExists = buckets.some(bucket => bucket.name === 'story_images');
    
    if (!storageExists) {
      console.log('Creating story_images bucket...');
      const { error } = await supabase.storage.createBucket('story_images', {
        public: true, // Make the bucket public so we can access images without authentication
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit per file
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
      } else {
        console.log('Storage bucket created successfully');
      }
    } else {
      console.log('Storage bucket story_images already exists');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase resources:', error);
  }
};
