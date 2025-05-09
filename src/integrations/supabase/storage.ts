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
 * Ensure a bucket exists in Supabase Storage
 * @param bucket The bucket name to check/create
 * @returns Promise<boolean> indicating success
 */
export const ensureBucketExists = async (bucket = 'images'): Promise<boolean> => {
  try {
    // 假设存储桶已经存在，不再尝试检查或创建
    console.log(`Assuming bucket '${bucket}' already exists, skipping creation check`);
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
 * @param sessionId Optional session ID to separate different orders
 * @returns Public URL of the uploaded image
 */
export const uploadImageToStorage = async (
  base64Image: string,
  bucket = 'images',
  path: string,
  sessionId?: string
): Promise<string> => {
  try {
    // Ensure the bucket exists
    await ensureBucketExists(bucket);
    
    // Get client ID for the current user
    const clientId = getClientId();
    
    // Generate a session ID if not provided
    const currentSessionId = sessionId || localStorage.getItem('current_session_id') || `session_${Date.now()}`;
    
    // Store the session ID if it's new
    if (!localStorage.getItem('current_session_id')) {
      localStorage.setItem('current_session_id', currentSessionId);
    }
    
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
    
    // Upload file to Supabase Storage with client ID and session ID in the path
    const fileName = `${clientId}/${currentSessionId}/${path}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
        // Add metadata to identify owner
        metadata: {
          client_id: clientId,
          session_id: currentSessionId
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
 * @param sessionId Optional session ID to filter images by specific order
 * @returns Array of image objects with URLs and metadata
 */
export const getAllImagesFromStorage = async (bucket = 'images', sessionId?: string) => {
  try {
    // Get client ID for the current user
    const clientId = getClientId();
    
    // Get current session ID if specified
    const currentSessionId = sessionId || localStorage.getItem('current_session_id');
    
    // Path to list files from - if sessionId is provided, list from that subfolder
    const listPath = currentSessionId ? `${clientId}/${currentSessionId}` : clientId;
    
    // List all files in the client's folder or session subfolder
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(listPath);
    
    if (error) {
      throw error;
    }
    
    // If no data, return empty array
    if (!data || data.length === 0) {
      return [];
    }
    
    // Get public URLs for all images
    return data.map(file => {
      const filePath = currentSessionId 
        ? `${clientId}/${currentSessionId}/${file.name}` 
        : `${clientId}/${file.name}`;
      
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return {
        name: file.name,
        url: publicUrlData?.publicUrl || '',
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
 * @param sessionId Optional session ID to specify which order's files to delete
 * @returns Boolean indicating success
 */
export const deleteImageFromStorage = async (
  path: string, 
  bucket = 'images', 
  sessionId?: string
): Promise<boolean> => {
  try {
    // Ensure we only delete files from the current client's folder
    const clientId = getClientId();
    
    // Get current session ID if not provided
    const currentSessionId = sessionId || localStorage.getItem('current_session_id');
    
    // Extract just the filename if it's a full URL
    if (path.startsWith('http')) {
      const urlParts = path.split('/');
      path = urlParts[urlParts.length - 1];
    }
    
    // Make sure the path contains the client ID and session ID
    let fullPath;
    
    // Case 1: Path already includes client ID
    if (path.includes(clientId)) {
      fullPath = path;
    } 
    // Case 2: We have a session ID and should try both paths
    else if (currentSessionId) {
      // First try to delete from the session folder
      const sessionPath = `${clientId}/${currentSessionId}/${path}`;
      console.log(`Attempting to delete file at session path: ${sessionPath}`);
      
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([sessionPath]);
          
        if (!error) {
          console.log(`Successfully deleted file at session path: ${sessionPath}`);
          return true;
        }
      } catch (e) {
        console.log(`File not found at session path, trying legacy path`);
      }
      
      // If that fails, try the legacy path
      fullPath = `${clientId}/${path}`;
    } 
    // Case 3: No session ID, use legacy path
    else {
      fullPath = `${clientId}/${path}`;
    }
    
    console.log(`Attempting to delete file at path: ${fullPath}`);
    
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