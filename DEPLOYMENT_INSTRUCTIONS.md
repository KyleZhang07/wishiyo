# Multiple Image Upload Feature - Deployment Instructions

This document explains how to deploy and test the new multiple image upload feature for love story generation.

## What Changed

1. **MomentsStep.tsx**: 
   - Added UI for uploading up to 3 additional photos (in addition to the main character photo)
   - Added storage in IndexedDB with keys `loveStoryInputImage2`, `loveStoryInputImage3`, and `loveStoryInputImage4`
   - Added UI to display, add, and remove additional photos

2. **GenerateStep.tsx**:
   - Added state for additional images
   - Updated API calls to include these additional images in the request body
   - Added loading code to retrieve additional images from IndexedDB

3. **Supabase Function (generate-love-cover)**:
   - Updated to accept additional images (`input_image2`, `input_image3`, `input_image4`)
   - Added a helper function to create base inputs with additional images
   - Applied changes to all API calls to ensure additional images are passed to the Replicate API

## Deploying the Supabase Function

To deploy the updated Supabase function:

1. Make sure you have the Supabase CLI installed:
   ```
   npm install -g supabase
   ```

2. Log in to Supabase:
   ```
   supabase login
   ```

3. Navigate to the project directory and deploy the function:
   ```
   cd /path/to/project
   supabase functions deploy generate-love-cover
   ```

Alternatively, you can deploy the function using the Supabase Dashboard:

1. Go to the Supabase Dashboard and select your project
2. Navigate to Edge Functions
3. Upload or paste the updated code for the `generate-love-cover` function
4. Deploy the function

## Testing the Feature

1. After deployment, navigate to the "Upload your character photos" step in the love story wizard.
2. Upload a main character photo.
3. The UI should now show an option to add additional photos (up to 3).
4. Upload additional photos and continue to the generation step.
5. The additional photos should be used by the API for image generation.

## Troubleshooting

- Verify that photos are properly stored in IndexedDB by checking the Application tab in Chrome DevTools.
- Check the browser console for any errors during upload or API calls.
- Verify that the Supabase function logs show the additional images are received (in Supabase Dashboard > Edge Functions > Logs).
- If images aren't displaying properly, check that the file sizes aren't too large (limit is 10MB per image). 