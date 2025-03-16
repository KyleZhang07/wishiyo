import { supabase } from './client';

// 存储桶常量
export const BUCKET_IMAGES = 'images';
export const BUCKET_PDFS = 'pdfs';
export const BUCKET_COMPLETE_PAGES = 'complete-pages';

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
 * @returns Array of image objects with URLs and metadata
 */
export const getAllImagesFromStorage = async (bucket = 'images') => {
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
 * 上传完整页面图片到complete-pages桶
 * @param canvas HTML Canvas元素
 * @param pageType 页面类型 (cover, intro, content)
 * @param orderId 订单ID
 * @param pageIndex 页面索引 (对于内容页)
 * @returns 上传后的公共URL
 */
export const uploadCompletePage = async (
  canvas: HTMLCanvasElement,
  pageType: 'cover' | 'intro' | 'content',
  orderId: string,
  pageIndex?: number
): Promise<string> => {
  try {
    // 确保存储桶存在
    await ensureBucketExists(BUCKET_COMPLETE_PAGES);
    
    // 获取客户端ID
    const clientId = getClientId();
    
    // 获取高质量的图像数据
    const dataUrl = canvas.toDataURL('image/png', 1.0); // 使用PNG格式和最高质量
    
    // 构建文件名
    let fileName: string;
    if (pageType === 'content' && pageIndex !== undefined) {
      fileName = `${clientId}/${orderId}/${pageType}-${pageIndex}.png`;
    } else {
      fileName = `${clientId}/${orderId}/${pageType}.png`;
    }
    
    // 上传文件到Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_COMPLETE_PAGES)
      .upload(fileName, dataURLToBlob(dataUrl), {
        contentType: 'image/png',
        upsert: true,
        metadata: {
          client_id: clientId,
          order_id: orderId,
          page_type: pageType,
          page_index: pageIndex?.toString() || ''
        }
      });
    
    if (error) {
      throw error;
    }
    
    // 获取公共URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_COMPLETE_PAGES)
      .getPublicUrl(fileName);
    
    return publicUrlData?.publicUrl || '';
  } catch (error) {
    console.error('Error uploading complete page to Supabase Storage:', error);
    throw error;
  }
};

/**
 * 将Data URL转换为Blob对象
 * @param dataURL Data URL字符串
 * @returns Blob对象
 */
function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}