
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage } from '@/integrations/supabase/storage';

/**
 * Expands an image by adding background space around it
 * @param imageUrl - The URL of the image to expand
 * @returns Promise resolving to the expanded image data in base64 format
 */
export const expandImage = async (imageUrl: string): Promise<string> => {
  try {
    console.log('Starting image expansion for:', imageUrl);
    const { data, error } = await supabase.functions.invoke('expand-image', {
      body: { 
        imageUrl,
        textPrompt: "The expanded area should be: very clean with no objects and shapes; suitable for text placement(clean background); soft gradient background matching the original image tone; seamless transition"
      }
    });
    
    if (error) throw error;
    if (!data?.imageData) {
      throw new Error("No imageData returned from expand-image");
    }
    
    return data.imageData;
  } catch (err) {
    console.error("Error expanding image:", err);
    throw err;
  }
};

/**
 * Generates a text caption for an image based on a prompt
 * @param promptIndex - Index of the prompt to use
 * @returns Promise resolving to the generated text
 */
export const generateImageText = async (promptIndex: number) => {
  try {
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedTone = localStorage.getItem('loveStoryTone') || 'Heartfelt';
    const personName = localStorage.getItem('loveStoryPersonName');
    
    if (!savedPrompts) {
      console.error('No prompts found in localStorage');
      throw new Error('No prompts found');
    }
    
    const prompts = JSON.parse(savedPrompts);
    if (promptIndex < 0 || promptIndex >= prompts.length) {
      console.error(`Invalid prompt index: ${promptIndex}, prompts length: ${prompts.length}`);
      throw new Error(`Invalid prompt index: ${promptIndex}`);
    }
    
    const singlePrompt = prompts[promptIndex];
    
    console.log(`Generating text for prompt index ${promptIndex}:`, singlePrompt);
    
    const { data, error } = await supabase.functions.invoke('generate-image-text', {
      body: { 
        prompts: [singlePrompt],
        tone: savedTone,
        personName
      }
    });
    
    console.log('Response from generate-image-text:', data, error);
    
    if (error) {
      console.error('Error from generate-image-text:', error);
      throw error;
    }
    
    if (!data || !data.texts || !data.texts.length) {
      console.error('No text data received:', data);
      throw new Error('No text received from server');
    }
    
    console.log('Generated text response:', data);
    
    return data.texts[0];
  } catch (error) {
    console.error('Error generating image texts:', error);
    
    const savedTone = localStorage.getItem('loveStoryTone') || 'Heartfelt';
    return {
      text: "A special moment captured in time.",
      tone: savedTone
    };
  }
};

/**
 * Uploads an image to Supabase storage and returns the URL
 * @param imageData - The image data to upload
 * @param bucketName - The bucket to upload to
 * @param fileName - The name to save the file as
 * @returns Promise resolving to the storage URL
 */
export const uploadAndSaveImage = async (
  imageData: string,
  bucketName: string,
  fileName: string
): Promise<string> => {
  const timestamp = Date.now();
  const fullFileName = `${fileName}-${timestamp}`;
  
  return uploadImageToStorage(imageData, bucketName, fullFileName);
};
