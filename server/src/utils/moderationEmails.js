import { Resend } from 'resend';
import { generateInvoicePDF } from './pdfGenerator.js';

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

/* ─────────────────────────────────────────────────────────
   PURCHASE FLOW EMAILS
───────────────────────────────────────────────────────── */

/**
 * Notifies a seller via email when one of their products is sold.
 * @param {object} seller     - { name, email }
 * @param {object} buyer      - { name, email }
 * @param {string} productTitle
 * @param {number} sellerAmount  - Net amount the seller earns (after platform fee)
 * @param {string} invoiceNumber
 * @param {string} orderId
 */
export async function sendSaleNotificationEmail(seller, buyer, productTitle, sellerAmount, invoiceNumber, orderId) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping sendSaleNotificationEmail: RESEND_API_KEY is not set.');
    return;
  }

  const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/seller/sales`;
  const subject = `You just made a sale — "${productTitle}"`;

  const html = `
  <div style="background:#f3f4f6;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#082453;padding:16px;text-align:center;">
         <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;font-style:italic;">BitForge</div>
      </div>

      <!-- Body -->
      <div style="padding:24px 20px;text-align:center;">
        
        <!-- Success Icon -->
        <div style="margin-bottom:12px;">
          <div style="display:inline-block;width:36px;height:36px;background:#10b981;border-radius:50%;line-height:36px;color:#fff;font-size:18px;font-weight:bold;">✓</div>
        </div>

        <h1 style="margin:0 0 6px;font-size:26px;color:#111827;font-weight:700;">₹${Number(sellerAmount).toFixed(2)}</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Sale Confirmed</p>

        <div style="border-top:1px solid #e5e7eb;margin-bottom:20px;"></div>

        <!-- Details Table -->
        <table style="width:100%;border-collapse:collapse;text-align:left;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;width:40%;">Product</td>
            <td style="padding:6px 0;font-size:13px;color:#111827;text-align:right;font-weight:500;">${productTitle}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;">Invoice Id</td>
            <td style="padding:6px 0;font-size:13px;color:#111827;text-align:right;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;vertical-align:top;">Buyer Details</td>
            <td style="padding:6px 0;font-size:13px;color:#2563eb;text-align:right;vertical-align:top;text-decoration:none;">${buyer?.email || 'N/A'}<br/>${buyer?.name ? `<span style="color:#6b7280;">${buyer.name}</span>` : ''}</td>
          </tr>
        </table>

      </div>

    </div>
    
    <div style="max-width:600px;margin:20px auto 0;text-align:center;font-size:12px;color:#6b7280;line-height:1.6;">
      <p style="margin:0;">You can view the sale details on the <a href="${dashboardUrl}" style="color:#2563eb;text-decoration:none;">Seller Dashboard</a>.</p>
      <p style="margin:4px 0 0;">For further assistance, you can reach out to us <a href="mailto:help@bittforge.in" style="color:#2563eb;text-decoration:none;">here</a>.</p>
    </div>
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
 * Sends the buyer a proper invoice email after a successful purchase.
 * @param {object} buyer              - { name, email }
 * @param {object} invoiceData        - invoice fields (invoiceNumber, productName, etc.)
 */
export async function sendBuyerInvoiceEmail(buyer, invoiceData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping sendBuyerInvoiceEmail: RESEND_API_KEY is not set.');
    return;
  }

  const {
    invoiceNumber,
    invoiceDate,
    productName,
    productDescription,
    originalPrice,
    discountPercent,
    discountAmount,
    priceAfterDiscount,
    gstRate,
    gstAmount,
    platformFee,
    totalAmount,
    razorpayPaymentId,
    paymentMethod,
  } = invoiceData;

  const subject = `Your BitForge receipt — ${productName}`;
  const ordersUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/buyer/purchases`;
  const formattedDate = new Date(invoiceDate || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const gstPercent = Math.round((gstRate || 0.05) * 100);
  const platformFeePercent = 2;

  const row = (label, value, highlight = false) => `
    <tr>
      <td style="padding:6px 0;font-size:12px;color:${highlight ? '#111827' : '#6b7280'};font-weight:${highlight ? '700' : '400'};">${label}</td>
      <td style="padding:6px 0;font-size:12px;color:${highlight ? '#111827' : '#374151'};font-weight:${highlight ? '700' : '400'};text-align:right;">${value}</td>
    </tr>`;

  const html = `
  <div style="background:#f3f4f6;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#082453;padding:16px;text-align:center;">
         <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;font-style:italic;">BitForge</div>
      </div>

      <!-- Body -->
      <div style="padding:24px 20px;text-align:center;">
        
        <!-- Success Icon -->
        <div style="margin-bottom:12px;">
          <div style="display:inline-block;width:36px;height:36px;background:#10b981;border-radius:50%;line-height:36px;color:#fff;font-size:18px;font-weight:bold;">✓</div>
        </div>

        <h1 style="margin:0 0 6px;font-size:26px;color:#111827;font-weight:700;">₹${Number(totalAmount).toFixed(2)}</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Payment Successful</p>

        <div style="border-top:1px solid #e5e7eb;margin-bottom:20px;"></div>

        <!-- Details Table -->
        <table style="width:100%;border-collapse:collapse;text-align:left;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#6b7280;width:40%;">Payment Id</td>
            <td style="padding:6px 0;font-size:12px;color:#111827;text-align:right;">${razorpayPaymentId || invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#6b7280;">Amount</td>
            <td style="padding:6px 0;font-size:12px;color:#111827;text-align:right;">₹${Number(totalAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#6b7280;vertical-align:top;">Order Details</td>
            <td style="padding:6px 0;font-size:12px;color:#111827;text-align:right;vertical-align:top;">${productName}</td>
          </tr>
        </table>

      </div>

    </div>
    
    <div style="max-width:600px;margin:20px auto 0;text-align:center;font-size:11px;color:#6b7280;line-height:1.4;">
      <p style="margin:0;">You can view the purchase details on the <a href="${ordersUrl}" style="color:#2563eb;text-decoration:none;">Buyer Dashboard</a>.</p>
      <p style="margin:4px 0 0;">For further assistance, you can reach out to us <a href="mailto:help@bittforge.in" style="color:#2563eb;text-decoration:none;">here</a>.</p>
      <p style="margin:12px 0 0;font-size:10px;">Note: A detailed tax invoice is attached to this email.</p>
    </div>
  </div>
  `;

  const firstWord = productName ? productName.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "") : "BitForge";
  const filename = `${firstWord}_invoice.pdf`;

  let attachments = [];
  try {
    const pdfBuffer = await generateInvoicePDF(invoiceData);
    attachments.push({
      filename: filename,
      content: pdfBuffer
    });
  } catch (error) {
    console.error('[Email] Failed to generate PDF invoice attachment:', error);
  }

  return await resend.emails.send({
    from: getFromAddress(),
    to: buyer.email,
    replyTo: 'support@bitforge.com',
    subject,
    html,
    attachments
  });
}

/**
 * Sends an email to the admin when a seller requests a payout.
 * @param {object} seller - { name, email }
 * @param {number} amount - requested amount
 */
export async function sendPayoutRequestAdminEmail(seller, amount) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping sendPayoutRequestAdminEmail: RESEND_API_KEY is not set.');
    return;
  }

  const subject = `New Payout Request: ₹${amount} from ${seller.name || seller.email}`;
  const adminDashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/admin/payouts`;

  const html = `
  <div style="background:#f3f4f6;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#082453;padding:16px;text-align:center;">
         <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;font-style:italic;">BitForge Admin</div>
      </div>

      <!-- Body -->
      <div style="padding:24px 20px;text-align:center;">
        
        <div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 12px;border-radius:20px;margin-bottom:12px;">
          NEW PAYOUT REQUEST
        </div>

        <h1 style="margin:0 0 6px;font-size:26px;color:#111827;font-weight:700;">₹${Number(amount).toFixed(2)}</h1>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Action Required</p>

        <div style="border-top:1px solid #e5e7eb;margin-bottom:20px;"></div>

        <!-- Details Table -->
        <table style="width:100%;border-collapse:collapse;text-align:left;margin-bottom:24px;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#6b7280;width:40%;">Seller Name</td>
            <td style="padding:6px 0;font-size:12px;color:#111827;text-align:right;font-weight:500;">${seller.name || 'Unknown'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#6b7280;">Seller Email</td>
            <td style="padding:6px 0;font-size:12px;color:#111827;text-align:right;">${seller.email}</td>
          </tr>
        </table>
        
        <a href="${adminDashboardUrl}" style="display:inline-block;padding:10px 24px;background:#111827;color:white;text-decoration:none;border-radius:4px;font-weight:600;font-size:13px;letter-spacing:0.5px;">
          REVIEW REQUEST
        </a>

      </div>

    </div>
    
    <div style="max-width:600px;margin:20px auto 0;text-align:center;font-size:11px;color:#6b7280;line-height:1.4;">
      <p style="margin:0;">This is an automated administrative notification.</p>
      <p style="margin:4px 0 0;">© 2026 BitForge. All rights reserved.</p>
    </div>
  </div>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bittforge.in';

  // Sending to the admin email for admin notification
  return await resend.emails.send({
    from: getFromAddress(),
    to: adminEmail, // Send to actual admin email
    subject,
    html,
  });
}

