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
    let fileName = path;
    if (path.startsWith('http')) {
      const urlParts = path.split('/');
      fileName = urlParts[urlParts.length - 1];
    }
    
    console.log(`Attempting to delete image: ${fileName}`);
    
    // Track all attempted deletion paths
    const deletionAttempts: string[] = [];
    let deletionSuccess = false;
    
    // Strategy 1: If path already includes full client/session path structure
    if (path.includes('/')) {
      console.log(`Attempting deletion with full path: ${path}`);
      deletionAttempts.push(path);
      
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([path]);
          
        if (!error) {
          console.log(`Successfully deleted file at full path: ${path}`);
          deletionSuccess = true;
        }
      } catch (e) {
        console.log(`Failed to delete at full path: ${path}`);
      }
    }
    
    // Strategy 2: Try current session path if we have a session ID
    if (!deletionSuccess && currentSessionId) {
      const sessionPath = `${clientId}/${currentSessionId}/${fileName}`;
      console.log(`Attempting deletion at session path: ${sessionPath}`);
      deletionAttempts.push(sessionPath);
      
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([sessionPath]);
          
        if (!error) {
          console.log(`Successfully deleted file at session path: ${sessionPath}`);
          deletionSuccess = true;
        }
      } catch (e) {
        console.log(`Failed to delete at session path: ${sessionPath}`);
      }
    }
    
    // Strategy 3: Try legacy client-only path
    if (!deletionSuccess) {
      const legacyPath = `${clientId}/${fileName}`;
      console.log(`Attempting deletion at legacy path: ${legacyPath}`);
      deletionAttempts.push(legacyPath);
      
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([legacyPath]);
          
        if (!error) {
          console.log(`Successfully deleted file at legacy path: ${legacyPath}`);
          deletionSuccess = true;
        }
      } catch (e) {
        console.log(`Failed to delete at legacy path: ${legacyPath}`);
      }
    }
    
    // Strategy 4: Search and delete all matching files across all session folders
    if (!deletionSuccess) {
      console.log(`File not found in expected paths, searching across all session folders...`);
      
      try {
        // List all items in the client folder to find session subfolders
        const { data: clientItems, error: listError } = await supabase.storage
          .from(bucket)
          .list(clientId);
          
        if (!listError && clientItems) {
          // Find all session folders
          const sessionFolders = clientItems.filter(item => 
            item.name && item.name.startsWith('session_')
          );
          
          console.log(`Found ${sessionFolders.length} session folders to search`);
          
          // Search in each session folder
          for (const sessionFolder of sessionFolders) {
            const searchPath = `${clientId}/${sessionFolder.name}`;
            
            try {
              const { data: sessionItems, error: sessionListError } = await supabase.storage
                .from(bucket)
                .list(searchPath);
                
              if (!sessionListError && sessionItems) {
                // Find files that match our target filename
                const matchingFiles = sessionItems.filter(item =>
                  item.name === fileName || item.name.includes(fileName.replace(/\.[^/.]+$/, ""))
                );
                
                if (matchingFiles.length > 0) {
                  console.log(`Found ${matchingFiles.length} matching files in ${searchPath}`);
                  
                  // Delete all matching files
                  const filesToDelete = matchingFiles.map(file => `${searchPath}/${file.name}`);
                  
                  const { error: deleteError } = await supabase.storage
                    .from(bucket)
                    .remove(filesToDelete);
                    
                  if (!deleteError) {
                    console.log(`Successfully deleted ${matchingFiles.length} files from ${searchPath}`);
                    deletionSuccess = true;
                  }
                }
              }
            } catch (sessionError) {
              console.log(`Error searching in session folder ${sessionFolder.name}:`, sessionError);
            }
          }
        }
      } catch (searchError) {
        console.log(`Error during comprehensive search:`, searchError);
      }
    }
    
    if (!deletionSuccess) {
      console.warn(`Failed to delete file ${fileName} from any of the attempted paths:`, deletionAttempts);
      return false;
    }
    
    console.log(`Successfully deleted file: ${fileName}`);
    return true;
    
  } catch (error) {
    console.error('Error deleting image from Supabase Storage:', error);
    return false;
  }
};

/**
 * Deletes all content images with a specific index from Supabase Storage
 * This function is specifically designed for regenerate functionality
 * @param contentIndex The content index to delete (e.g., 1, 2, 3...)
 * @param bucket Bucket name
 * @param sessionId Optional session ID to specify which session's files to delete
 * @returns Number of files deleted
 */
export const deleteContentImagesByIndex = async (
  contentIndex: number,
  bucket = 'images',
  sessionId?: string
): Promise<number> => {
  try {
    const clientId = getClientId();
    const currentSessionId = sessionId || localStorage.getItem('current_session_id');
    
    console.log(`Searching for content-${contentIndex} images to delete in current session only...`);
    
    let totalDeleted = 0;
    const contentPattern = new RegExp(`content-${contentIndex}-\\d+`);
    
    // Only search in current session folder
    if (currentSessionId) {
      const sessionPath = `${clientId}/${currentSessionId}`;
      console.log(`Searching in current session folder: ${sessionPath}`);
      
      try {
        const { data: sessionItems, error: sessionListError } = await supabase.storage
          .from(bucket)
          .list(sessionPath);
          
        if (!sessionListError && sessionItems) {
          const matchingFiles = sessionItems.filter(item =>
            item.name && contentPattern.test(item.name)
          );
          
          if (matchingFiles.length > 0) {
            console.log(`Found ${matchingFiles.length} matching content images in current session`);
            
            const filesToDelete = matchingFiles.map(file => `${sessionPath}/${file.name}`);
            
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove(filesToDelete);
              
            if (!deleteError) {
              console.log(`Successfully deleted ${matchingFiles.length} content images from current session`);
              totalDeleted += matchingFiles.length;
            } else {
              console.error(`Error deleting files from current session:`, deleteError);
            }
          } else {
            console.log(`No matching content-${contentIndex} images found in current session`);
          }
        }
      } catch (sessionError) {
        console.log(`Error searching in current session:`, sessionError);
      }
    } else {
      // Fallback: if no session ID, search in legacy client-only path
      console.log(`No session ID found, searching in legacy client folder: ${clientId}`);
      
      try {
        const { data: clientItems, error: clientListError } = await supabase.storage
          .from(bucket)
          .list(clientId);
          
        if (!clientListError && clientItems) {
          // Find direct files (legacy format)
          const directMatchingFiles = clientItems.filter(item =>
            item.name && contentPattern.test(item.name) && !item.name.startsWith('session_')
          );
          
          if (directMatchingFiles.length > 0) {
            console.log(`Found ${directMatchingFiles.length} matching content images in legacy format`);
            
            const filesToDelete = directMatchingFiles.map(file => `${clientId}/${file.name}`);
            
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove(filesToDelete);
              
            if (!deleteError) {
              console.log(`Successfully deleted ${directMatchingFiles.length} content images from legacy format`);
              totalDeleted += directMatchingFiles.length;
            } else {
              console.error(`Error deleting files from legacy format:`, deleteError);
            }
          }
        }
      } catch (clientError) {
        console.log(`Error searching in legacy client folder:`, clientError);
      }
    }
    
    console.log(`Total content-${contentIndex} images deleted from current session: ${totalDeleted}`);
    return totalDeleted;
    
  } catch (error) {
    console.error('Error deleting content images by index:', error);
    return 0;
  }
};