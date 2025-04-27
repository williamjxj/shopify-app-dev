// app/routes/api.images.generate.js
import { json } from '@remix-run/node';
import { authenticateApi } from '../lib/authenticate.server';
import { connectToDatabase } from '../lib/db.server';
import Image from '../models/Image.server';
import { uploadToS3, generateWatermark } from '../lib/image-processing.server';

// Mock third-party AI service integration
async function callAIService(originalImageUrl, style, details) {
  // In a real implementation, you would call your AI service API here
  // This is a mock that simulates a delay and returns a fake URL
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Replace this with actual API integration
  return {
    success: true,
    imageUrl: `https://example.com/generated-${style}-${Date.now()}.jpg`
  };
}

export async function action({ request }) {
  // Authenticate the request
  const { shop, session } = await authenticateApi(request);
  if (!shop || !session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const style = formData.get('style');
    const details = formData.get('details');
    
    if (!imageFile || !style) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Upload original image to S3
    const originalImageUrl = await uploadToS3(imageFile, 'original');
    
    // Call AI service to generate the image
    const aiResponse = await callAIService(originalImageUrl, style, details);
    
    if (!aiResponse.success) {
      return json({ error: 'Failed to generate image' }, { status: 500 });
    }
    
    // Download the generated image and apply watermark
    const generatedImageUrl = aiResponse.imageUrl;
    const watermarkedImageUrl = await generateWatermark(generatedImageUrl);
    
    // Save to database
    await connectToDatabase();
    const image = new Image({
      userId: session.id,
      shopId: shop.id,
      originalImageUrl,
      generatedImageUrl,
      watermarkedImageUrl,
      styleSelected: style,
      customizationDetails: details,
      isPurchased: false
    });
    
    await image.save();
    
    return json({
      success: true,
      id: image._id,
      watermarkedImageUrl,
      styleSelected: style
    });
    
  } catch (error) {
    console.error('Error generating image:', error);
    return json({ error: 'An error occurred during image generation' }, { status: 500 });
  }
}