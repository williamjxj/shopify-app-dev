// app/routes/webhooks.js
import { authenticateWebhook } from '../lib/authenticate.server';
import { connectToDatabase } from '../lib/db.server';
import Image from '../models/Image.server';

export async function action({ request }) {
  // Verify webhook is from Shopify
  const { shop, valid } = await authenticateWebhook(request);
  
  if (!valid) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const topic = request.headers.get('x-shopify-topic');

  if (topic === 'orders/paid') {
    try {
      const payload = await request.json();
      const order = payload;
      
      // Connect to database
      await connectToDatabase();
      
      // Process each line item
      for (const item of order.line_items) {
        // Find product ID from the line items
        const productId = item.product_id.toString();
        
        // Update image record to mark as purchased
        const updatedImage = await Image.findOneAndUpdate(
          { productId, isPurchased: false },
          { 
            isPurchased: true, 
            orderId: order.id.toString() 
          },
          { new: true }
        );
        
        if (updatedImage) {
          console.log(`Image ${updatedImage._id} marked as purchased`);
        }
      }
      
      return new Response('Webhook processed', { status: 200 });
    } catch (error) {
      console.error('Error processing order webhook:', error);
      return new Response('Processing error', { status: 500 });
    }
  }
  
  return new Response('Webhook received', { status: 200 });
}

export function loader() {
  // Handle GET requests to webhook URL
  return new Response('Webhook endpoint', { status: 200 });
}