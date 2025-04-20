import { supabase } from './client';

// Utility functions for Supabase Storage operations

/**
 * Get or create client ID for anonymous user identification
 * The client ID is stored in localStorage and used to identify the current browser
 * @returns The client ID for the current user
 */
export const getClientId = (): string => {
  const STORAGE_KEY = 'wishiyo_client_id';
  let clientId = localStorage.getItem(STORAGE_KEY);

  if (!clientId) {
    // Generate a new client ID if none exists
    clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, clientId);
  }

  return clientId;
};

/**
 * Ensure the specified bucket exists, creating it if needed
 * @param bucket Bucket name
 * @returns Boolean indicating if bucket exists or was created successfully
 */
export const ensureBucketExists = async (bucket = 'images'): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      throw error;
    }

    // If bucket doesn't exist, create it
    if (!buckets.find(b => b.name === bucket)) {
      console.log(`Bucket '${bucket}' does not exist, creating it...`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true
      });

      if (createError) {
        throw createError;
      }

      console.log(`Bucket '${bucket}' created successfully`);
    } else {
      console.log(`Bucket '${bucket}' already exists`);
    }

    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};

/**
 * Uploads a base64 image to Supabase Storage
 * @param base64Image Base64 encoded image string
 * @param bucket Bucket name
 * @param path Path within the bucket
 * @returns Public URL of the uploaded image
 */
export const uploadImageToStorage = async (
  base64Image: string,
  bucket = 'images',
  path: string
): Promise<string> => {
  try {
    // Ensure the bucket exists
    await ensureBucketExists(bucket);

    // Get client ID for the current user
    const clientId = getClientId();

    // Convert base64 to Blob
    const base64Data = base64Image.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: 'image/jpeg' });

    // Upload file to Supabase Storage with client ID in the path
    const fileName = `${clientId}/${path}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
        // Add metadata to identify owner
        metadata: {
          client_id: clientId
        }
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || '';
  } catch (error) {
    console.error('Error uploading image to Supabase Storage:', error);
    throw error;
  }
};

/**
 * Fetches all images from a specific bucket in Supabase Storage for the current client
 * @param bucket Bucket name
 * @param optimize Whether to optimize images (default: true)
 * @returns Array of image objects with URLs and metadata
 */
export const getAllImagesFromStorage = async (bucket = 'images', optimize = true) => {
  try {
    // Get client ID for the current user
    const clientId = getClientId();

    // List all files in the client's folder
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(clientId);

    if (error) {
      throw error;
    }

    // If no data, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    // Get public URLs for all images
    return data.map(file => {
      const filePath = `${clientId}/${file.name}`;
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      let imageUrl = publicUrlData?.publicUrl || '';

      // Apply optimization if enabled
      if (optimize && imageUrl) {
        // Determine if this is a thumbnail or full-size image
        const isThumbnail = file.name.includes('thumbnail') || file.name.includes('_small');

        // Apply different optimization settings based on image type
        if (isThumbnail) {
          // Thumbnails - smaller size, higher compression
          imageUrl = getOptimizedImageUrl(imageUrl, {
            width: 300,
            format: 'webp',
            quality: 80,
            resize: 'cover'
          });
        } else {
          // Full-size images - moderate compression, maintain dimensions
          imageUrl = getOptimizedImageUrl(imageUrl, {
            format: 'webp',
            quality: 85
          });
        }
      }

      return {
        name: file.name,
        url: imageUrl,
        originalUrl: publicUrlData?.publicUrl || '', // Keep original URL for reference
        metadata: file.metadata,
        created_at: file.created_at,
        updated_at: file.updated_at,
        id: file.id,
        client_id: clientId
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching images from Supabase Storage:', error);
    return [];
  }
};

/**
 * Deletes an image from Supabase Storage
 * @param path Path of the image to delete
 * @param bucket Bucket name
 * @returns Boolean indicating success
 */
export const deleteImageFromStorage = async (path: string, bucket = 'images'): Promise<boolean> => {
  try {
    // Ensure we only delete files from the current client's folder
    const clientId = getClientId();

    // Make sure the path contains the client ID
    const fullPath = path.includes(clientId) ? path : `${clientId}/${path}`;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fullPath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image from Supabase Storage:', error);
    return false;
  }
};

/**
 * Transforms a Supabase image URL to include optimization parameters
 * @param url Original Supabase image URL
 * @param options Transformation options
 * @returns Transformed URL with optimization parameters
 */
export const getOptimizedImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'jpg' | 'png';
  resize?: 'cover' | 'contain' | 'fill';
} = {}) => {
  if (!url) return url;

  try {
    // Create a URL object to parse the original URL
    const urlObj = new URL(url);

    // Add transformation parameters
    if (options.width) urlObj.searchParams.append('width', options.width.toString());
    if (options.height) urlObj.searchParams.append('height', options.height.toString());
    if (options.quality) urlObj.searchParams.append('quality', options.quality.toString());
    if (options.format) urlObj.searchParams.append('format', options.format);
    if (options.resize) urlObj.searchParams.append('resize', options.resize);

    return urlObj.toString();
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return url; // Return original URL if transformation fails
  }
};
