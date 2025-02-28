import { supabase } from './client';

// Utility functions for Supabase Storage operations

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
 * @param clientId Optional client ID to associate with the image
 * @returns Public URL of the uploaded image
 */
export const uploadImageToStorage = async (
  base64Image: string,
  bucket = 'images',
  path: string,
  clientId?: string
): Promise<string> => {
  try {
    // Ensure the bucket exists
    await ensureBucketExists(bucket);
    
    // Get client ID if not provided
    if (!clientId) {
      clientId = getClientId();
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
    
    // Upload file to Supabase Storage
    const fileName = `${path}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
        metadata: {
          clientId: clientId
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
 * Fetches all images from a specific bucket in Supabase Storage
 * @param bucket Bucket name
 * @param clientId Optional client ID to filter images by owner
 * @returns Array of image objects with URLs and metadata
 */
export const getAllImagesFromStorage = async (bucket = 'images', clientId?: string) => {
  try {
    // List all files in the bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .list();
    
    if (error) {
      throw error;
    }
    
    // 获取客户端ID，如果未提供
    if (!clientId) {
      clientId = getClientId();
    }
    
    // 过滤图片，只返回属于当前客户端的图片
    const userFiles = clientId 
      ? data?.filter(file => {
          // 检查文件元数据中的clientId是否匹配
          const fileClientId = file.metadata?.clientId;
          return fileClientId === clientId || fileClientId === undefined;
        })
      : data;
    
    // Get public URLs for all images
    return userFiles?.map(file => {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(file.name);
      
      return {
        name: file.name,
        url: publicUrlData?.publicUrl || '',
        metadata: file.metadata,
        created_at: file.created_at,
        updated_at: file.updated_at,
        id: file.id
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
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
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
 * 获取或创建客户端唯一ID
 * 用于区分不同的用户，无需登录
 * @returns 客户端唯一ID
 */
export const getClientId = (): string => {
  // 尝试从localStorage获取客户端ID
  let clientId = localStorage.getItem('wishiyo_client_id');
  
  // 如果不存在，则创建一个新的UUID
  if (!clientId) {
    // 生成一个随机的UUID
    clientId = 'client-' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15) + '-' + 
               Date.now().toString(36);
    
    // 保存到localStorage
    localStorage.setItem('wishiyo_client_id', clientId);
  }
  
  return clientId;
}; 