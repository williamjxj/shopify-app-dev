// app/routes/api.images.download.$id.js
import { authenticateApi } from '../lib/authenticate.server';
import { connectToDatabase } from '../lib/db.server';
import Image from '../models/Image.server';

export async function loader({ request, params }) {
  // Authenticate the request
  const { shop, session } = await authenticateApi(request);
  if (!shop || !session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const imageId = params.id;
    
    if (!imageId) {
      return new Response('Image ID is required', { status: 400 });
    }
    
    // Get image details from database
    await connectToDatabase();
    const image = await Image.findById(imageId);
    
    if (!image || image.userId !== session.id) {
      return new Response('Image not found', { status: 404 });
    }
    
    if (!image.isPurchased) {
      return new Response('Purchase required to download', { status: 403 });
    }
    
    // Fetch image from storage and serve
    const imageResponse = await fetch(image.generatedImageUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }
    
    // Set appropriate headers for downloading
    const fileExtension = image.generatedImageUrl.split('.').pop();
    const contentType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    const filename = `custom-painting-${image._id}.${fileExtension}`;
    
    return new Response(await imageResponse.blob(), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    console.error('Error downloading image:', error);
    return new Response('Failed to download image', { status: 500 });
  }
}