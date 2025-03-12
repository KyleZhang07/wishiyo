
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase connection details from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { 
      orderId, 
      bookData, 
      coverImage, 
      spineImage = null,
      clientId,
      productType = "funny-biography"
    } = await req.json();

    console.log(`Received request to save book data for order: ${orderId}`);
    
    // Ensure required fields are present
    if (!orderId || !bookData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create book-covers bucket if it doesn't exist
    try {
      const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
      
      if (bucketListError) {
        console.error("Error listing buckets:", bucketListError);
        throw bucketListError;
      }
      
      // Check if bucket exists
      const bucketExists = buckets?.some(b => b.name === 'book-covers');
      
      if (!bucketExists) {
        console.log("Creating book-covers bucket");
        const { error: createBucketError } = await supabase.storage.createBucket('book-covers', {
          public: true
        });
        
        if (createBucketError) {
          console.error("Error creating bucket:", createBucketError);
          throw createBucketError;
        }
        
        // Set public bucket policy after creation
        const { error: policyError } = await supabase.storage.from('book-covers').getPublicUrl('test.txt');
        if (policyError) {
          console.warn("Warning: Couldn't verify public access to bucket:", policyError);
        }
        
        console.log("Created book-covers bucket successfully");
      } else {
        console.log("book-covers bucket already exists");
      }
    } catch (bucketError) {
      console.error("Error with bucket operations:", bucketError);
      // Continue even if bucket creation fails, as it might already exist
    }

    // Upload cover image to storage if provided
    let coverImageUrl = null;
    if (coverImage) {
      console.log("Uploading cover image to storage");
      
      try {
        // Convert base64 to Blob
        const base64Data = coverImage.split(',')[1];
        const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Upload to storage with unique path
        const filePath = `${productType}/${clientId || 'anonymous'}/${orderId}/cover.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(filePath, byteArray, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error("Error uploading cover image:", uploadError);
          throw uploadError;
        } else {
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('book-covers')
            .getPublicUrl(filePath);
          
          coverImageUrl = publicUrlData?.publicUrl;
          console.log("Cover image uploaded successfully:", coverImageUrl);
        }
      } catch (imageError) {
        console.error("Error processing cover image:", imageError);
        // Continue with the function even if image upload fails
      }
    } else {
      console.warn("No cover image provided");
    }

    // Upload spine image to storage if provided
    let spineImageUrl = null;
    if (spineImage) {
      console.log("Uploading spine image to storage");
      
      try {
        // Convert base64 to Blob
        const base64Data = spineImage.split(',')[1];
        const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Upload to storage with unique path
        const filePath = `${productType}/${clientId || 'anonymous'}/${orderId}/spine.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(filePath, byteArray, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error("Error uploading spine image:", uploadError);
          throw uploadError;
        } else {
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('book-covers')
            .getPublicUrl(filePath);
          
          spineImageUrl = publicUrlData?.publicUrl;
          console.log("Spine image uploaded successfully:", spineImageUrl);
        }
      } catch (imageError) {
        console.error("Error processing spine image:", imageError);
        // Continue with the function even if image upload fails
      }
    }

    // Check if book_orders table exists, if not create it
    const { error: tableCheckError } = await supabase
      .from('book_orders')
      .select('id', { count: 'exact', head: true });
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log("book_orders table doesn't exist, creating it");
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.book_orders (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          order_id TEXT UNIQUE NOT NULL,
          product_id TEXT NOT NULL,
          client_id TEXT,
          title TEXT NOT NULL,
          format TEXT NOT NULL,
          price TEXT NOT NULL,
          user_data JSONB,
          cover_image_url TEXT,
          spine_image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;
      
      // Execute create table query
      const { error: createError } = await supabase.rpc('execute_sql', { query: createTableQuery });
      if (createError) {
        console.error("Error creating book_orders table:", createError);
        // Try to use the table anyway in case it exists despite the error
      } else {
        console.log("Created book_orders table successfully");
      }
    }

    // Save book data to the database
    console.log("Saving book data to database");
    const { data, error } = await supabase
      .from('book_orders')
      .upsert({
        order_id: orderId,
        product_id: productType,
        title: bookData.title || 'Untitled Book',
        format: bookData.format || 'hardcover',
        price: bookData.price?.toString() || '0',
        user_data: bookData,
        cover_image_url: coverImageUrl,
        spine_image_url: spineImageUrl,
        client_id: clientId || 'anonymous'
      }, {
        onConflict: 'order_id'
      });

    if (error) {
      console.error("Error saving book data:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Book data saved successfully");
    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId, 
        coverImageUrl,
        spineImageUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
