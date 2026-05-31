/**
 * Cloudflare Worker for processing contentSellify uploads
 * 
 * 1. Create a new Worker in Cloudflare Dashboard
 * 2. Paste this code
 * 3. Add Environment Variables:
 *    - INTERNAL_SECRET (must match process.env.INTERNAL_SECRET on your Node backend)
 *    - BACKEND_API_URL (e.g., https://api.yoursite.com)
 * 4. Configure R2 Event Notifications to trigger this Worker on `PutObject`
 */

export default {
  // If triggered directly by R2 event binding (or queue)
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const event = message.body;
        
        // Only process PutObject events
        if (event.action !== 'PutObject') {
          message.ack();
          continue;
        }

        const r2Key = event.object.key;
        
        // Skip if it's not in the products directory
        if (!r2Key.startsWith('products/')) {
          message.ack();
          continue;
        }

        console.log(`Processing new upload: ${r2Key}`);

        // In a real scenario, you could use an external API like Cloudinary or PDF.js here.
        // Since generating thumbnails and PDFs directly in a Worker can hit CPU limits,
        // you might optionally farm it out to a 3rd party API, OR rely on the Node.js
        // server for preview generation as well.

        // Notify Node.js backend that the file is ready
        const webhookResponse = await fetch(`${env.BACKEND_API_URL}/api/products/internal/upload-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': env.INTERNAL_SECRET
          },
          body: JSON.stringify({
            r2Key: r2Key,
            // thumbnailUrl: "generated_url_here",
            // previewUrl: "generated_pdf_preview_here"
          })
        });

        if (!webhookResponse.ok) {
          throw new Error(`Webhook failed with status ${webhookResponse.status}`);
        }

        console.log(`Successfully processed ${r2Key}`);
        message.ack();
      } catch (error) {
        console.error(`Failed to process message: ${error.message}`);
        message.retry();
      }
    }
  }
};
