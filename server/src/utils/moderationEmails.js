import { Resend } from 'resend';

// Provide a fallback for local testing without crashing if key is missing,
// but real delivery requires the key.
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

// We use the configured from address, or fallback to the one requested by the user.
const getFromAddress = () => process.env.RESEND_FROM_EMAIL || 'noreply@bitforge.com';

/**
 * Sends an email to the seller when their product is approved.
 */
export async function sendApprovalEmail(seller, product) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping sendApprovalEmail: RESEND_API_KEY is not set.');
    return;
  }

  const subject = `Your product '${product.title}' is now live on BitForge`;
  
  // Link assuming standard frontend routing or just a generic link if actual product URL pattern is unknown
  const productUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/products/${product._id}`;

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Good news, ${seller.name}!</h2>
      <p>Your product <strong>${product.title}</strong> has been approved by our moderation team and is now live on the marketplace.</p>
      <p>Thank you for contributing to BitForge!</p>
      <a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Your Product</a>
    </div>
  `;

  return await resend.emails.send({
    from: getFromAddress(),
    to: seller.email,
    replyTo: 'support@bitforge.com',
    subject,
    html,
  });
}

/**
 * Sends an email to the seller when their product is rejected.
 */
export async function sendRejectionEmail(seller, product, reasons = [], adminMessage = '') {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping sendRejectionEmail: RESEND_API_KEY is not set.');
    return;
  }

  const subject = `Your product '${product.title}' was not approved`;
  const sellerDashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/seller/products`;

  let reasonsHtml = '';
  if (reasons.length > 0) {
    reasonsHtml = `
      <h3>Reasons for rejection:</h3>
      <ul>
        ${reasons.map(r => `<li>${r}</li>`).join('')}
      </ul>
    `;
  }

  let noteHtml = '';
  if (adminMessage) {
    noteHtml = `
      <h3>Moderator Note:</h3>
      <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; color: #4b5563;">
        ${adminMessage}
      </blockquote>
    `;
  }

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Update regarding your submission</h2>
      <p>Hi ${seller.name},</p>
      <p>Unfortunately, your product <strong>${product.title}</strong> was not approved for listing on BitForge.</p>
      
      ${reasonsHtml}
      ${noteHtml}
      
      <p>If you believe this was a mistake or you have rectified these issues, you can submit a new version of the product.</p>
      
      <a href="${sellerDashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Go to Seller Dashboard</a>
    </div>
  `;

  return await resend.emails.send({
    from: getFromAddress(),
    to: seller.email,
    replyTo: 'support@bitforge.com',
    subject,
    html,
  });
}

/**
 * Sends an email to the seller when changes are requested.
 */
export async function sendChangesRequestedEmail(seller, product, reasons = [], adminMessage = '') {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping sendChangesRequestedEmail: RESEND_API_KEY is not set.');
    return;
  }

  const subject = `Action required: '${product.title}' needs updates`;
  const sellerDashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/seller/products`;

  let reasonsHtml = '';
  if (reasons.length > 0) {
    reasonsHtml = `
      <h3>What needs to change:</h3>
      <ul>
        ${reasons.map(r => `<li>${r}</li>`).join('')}
      </ul>
    `;
  }

  let noteHtml = '';
  if (adminMessage) {
    noteHtml = `
      <h3>Moderator Note:</h3>
      <blockquote style="border-left: 4px solid #f59e0b; padding-left: 16px; color: #4b5563;">
        ${adminMessage}
      </blockquote>
    `;
  }

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Updates needed for your submission</h2>
      <p>Hi ${seller.name},</p>
      <p>We're currently reviewing your product <strong>${product.title}</strong>, but we need you to make a few updates before it can go live.</p>
      
      ${reasonsHtml}
      ${noteHtml}
      
      <p>Please log in to your dashboard, make the required changes, and resubmit for review.</p>
      
      <a href="${sellerDashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px;">Go to Seller Dashboard</a>
    </div>
  `;

  return await resend.emails.send({
    from: getFromAddress(),
    to: seller.email,
    replyTo: 'support@bitforge.com',
    subject,
    html,
  });
}

/**
 * Sends an email to the seller when their product is flagged for security threats.
 */
export async function sendThreatNotificationEmail(seller, product, adminMessage = '') {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping sendThreatNotificationEmail: RESEND_API_KEY is not set.');
    return;
  }

  const subject = `URGENT: Security threat detected in your product '${product.title}'`;
  const sellerDashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/seller/products`;

  let noteHtml = '';
  if (adminMessage) {
    noteHtml = `
      <h3>Moderator Note:</h3>
      <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; color: #4b5563;">
        ${adminMessage}
      </blockquote>
    `;
  }

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Urgent Security Notice</h2>
      <p>Hi ${seller.name},</p>
      <p>Our security scanners have detected potential threats in the files you uploaded for <strong>${product.title}</strong>.</p>
      
      ${noteHtml}
      
      <p>Please review your files immediately, ensure they are free of any malicious software, and re-upload safe versions.</p>
      
      <a href="${sellerDashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Go to Seller Dashboard</a>
    </div>
  `;

  return await resend.emails.send({
    from: getFromAddress(),
    to: seller.email,
    replyTo: 'support@bitforge.com',
    subject,
    html,
  });
}
