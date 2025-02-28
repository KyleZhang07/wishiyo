
import { supabase } from "@/integrations/supabase/client";

// 图片存储桶名称
const IMAGES_BUCKET = 'story_images';

/**
 * 上传图片到 Supabase 存储
 * @param key 图片的唯一标识符
 * @param imageData base64 编码的图片数据
 * @returns 存储的图片 URL
 */
export const uploadImage = async (key: string, imageData: string): Promise<string | null> => {
  try {
    // 确保 key 是有效的文件名
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // 将 base64 转换为 blob
    const blob = base64ToBlob(imageData);
    
    // 生成完整路径，包含时间戳以避免缓存问题
    const timestamp = new Date().getTime();
    const filePath = `${safeKey}_${timestamp}.jpg`;
    
    // 上传文件到 Supabase
    const { data, error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(filePath, blob, {
        upsert: true, // 覆盖同名文件
        contentType: 'image/jpeg'
      });
    
    if (error) {
      console.error('Error uploading image to Supabase:', error);
      return null;
    }
    
    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(filePath);
    
    // 保存最新的图片路径到映射表中，以便以后可以通过 key 找到最新的图片
    await updateImageKeyMapping(key, filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image to Supabase:', error);
    return null;
  }
};

/**
 * 获取图片的公共 URL
 * @param key 图片的唯一标识符
 * @returns 图片的公共 URL，如果不存在则返回 null
 */
export const getImageUrl = async (key: string): Promise<string | null> => {
  try {
    // 先从映射表中获取最新的文件路径
    const filePath = await getLatestImagePath(key);
    
    if (!filePath) {
      console.log(`No image found for key ${key}`);
      return null;
    }
    
    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Failed to get image URL from Supabase:', error);
    return null;
  }
};

/**
 * 删除图片及其映射
 * @param key 图片的唯一标识符
 */
export const deleteImage = async (key: string): Promise<boolean> => {
  try {
    // 获取该 key 对应的所有文件路径
    const { data, error } = await supabase
      .from('image_key_mappings')
      .select('file_path')
      .eq('key', key);
    
    if (error) {
      console.error('Error getting image paths for deletion:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      // 删除所有关联的文件
      const filePaths = data.map(item => item.file_path);
      
      const { error: deleteError } = await supabase.storage
        .from(IMAGES_BUCKET)
        .remove(filePaths);
      
      if (deleteError) {
        console.error('Error deleting images from storage:', deleteError);
      }
      
      // 删除映射记录
      const { error: mappingError } = await supabase
        .from('image_key_mappings')
        .delete()
        .eq('key', key);
      
      if (mappingError) {
        console.error('Error deleting image mappings:', mappingError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete image from Supabase:', error);
    return false;
  }
};

/**
 * 将 base64 编码的图片数据转换为 Blob 对象
 */
function base64ToBlob(base64: string): Blob {
  // 移除可能的 base64 数据 URL 前缀
  const base64Data = base64.includes('base64,') 
    ? base64.split('base64,')[1] 
    : base64;
  
  // 转换 base64 为二进制字符串
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: 'image/jpeg' });
}

/**
 * 更新图片键映射关系
 */
async function updateImageKeyMapping(key: string, filePath: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('image_key_mappings')
      .insert({
        key,
        file_path: filePath,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error updating image key mapping:', error);
    }
  } catch (error) {
    console.error('Failed to update image key mapping:', error);
  }
}

/**
 * 获取指定键的最新图片路径
 */
async function getLatestImagePath(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('image_key_mappings')
      .select('file_path')
      .eq('key', key)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error getting latest image path:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0].file_path : null;
  } catch (error) {
    console.error('Failed to get latest image path:', error);
    return null;
  }
}

/**
 * 获取所有图片映射
 */
export const getAllImageMappings = async (): Promise<Array<{key: string, url: string}>> => {
  try {
    const { data, error } = await supabase
      .from('image_key_mappings')
      .select('key, file_path, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting all image mappings:', error);
      return [];
    }
    
    // 去重 - 每个键只保留最新的一个记录
    const keyMap = new Map();
    data?.forEach(item => {
      if (!keyMap.has(item.key)) {
        keyMap.set(item.key, item.file_path);
      }
    });
    
    // 转换为 URL 列表
    const results: Array<{key: string, url: string}> = [];
    for (const [key, filePath] of keyMap.entries()) {
      const { data: { publicUrl } } = supabase.storage
        .from(IMAGES_BUCKET)
        .getPublicUrl(filePath as string);
      
      results.push({ key, url: publicUrl });
    }
    
    return results;
  } catch (error) {
    console.error('Failed to get all image mappings:', error);
    return [];
  }
};
