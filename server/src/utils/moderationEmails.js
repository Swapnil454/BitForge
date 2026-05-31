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
  <div style="background:#0b0f1a;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:580px;margin:0 auto;">

      <!-- Header -->
      <div style="text-align:center;padding:20px 20px 16px;background:linear-gradient(135deg,#0b1220,#0f172a);border-radius:16px 16px 0 0;border-bottom:1px solid rgba(255,255,255,0.08);">
        <img src="https://res.cloudinary.com/djhuduvrr/image/upload/f_auto,q_auto,w_520/bitforge_logo1_tuzvyi.png" alt="BitForge" width="180" style="display:block;margin:0 auto 6px;" />
        <div style="font-size:15px;font-weight:700;color:#ffffff;">BitForge</div>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:32px 28px;border-radius:0 0 14px 14px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">

        <div style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700;letter-spacing:1px;padding:4px 12px;border-radius:20px;margin-bottom:16px;">
          SALE CONFIRMED
        </div>

        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">You made a sale! 🎉</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
          Hi <strong>${seller.name}</strong>, great news — someone just purchased your product.
        </p>

        <!-- Sale details box -->
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#6b7280;">Product</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;text-align:right;">${productTitle}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#6b7280;">Buyer</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;text-align:right;">${buyer?.name || buyer?.email || 'A buyer'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#6b7280;">Invoice #</td>
              <td style="padding:6px 0;font-size:13px;color:#6366f1;font-weight:600;text-align:right;">${invoiceNumber}</td>
            </tr>
            <tr style="border-top:1px solid #e5e7eb;">
              <td style="padding:12px 0 6px;font-size:15px;color:#111827;font-weight:700;">Your earnings</td>
              <td style="padding:12px 0 6px;font-size:20px;color:#10b981;font-weight:800;text-align:right;">₹${Number(sellerAmount).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="margin:0 0 20px;font-size:13px;color:#6b7280;line-height:1.5;">
          Your earnings will be added to your pending balance and will be available for payout once cleared.
        </p>

        <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          View Sales Dashboard
        </a>

        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
          Need help? <a href="mailto:help@bittforge.in" style="color:#6366f1;text-decoration:none;">help@bittforge.in</a>
        </p>
      </div>

      <div style="text-align:center;margin-top:18px;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 BitForge. All rights reserved.</p>
        <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">This is an automated message. Please do not reply.</p>
      </div>

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
      <td style="padding:7px 0;font-size:13px;color:${highlight ? '#111827' : '#6b7280'};font-weight:${highlight ? '700' : '400'};">${label}</td>
      <td style="padding:7px 0;font-size:13px;color:${highlight ? '#111827' : '#374151'};font-weight:${highlight ? '700' : '400'};text-align:right;">${value}</td>
    </tr>`;

  const html = `
  <div style="background:#0b0f1a;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:580px;margin:0 auto;">

      <!-- Header -->
      <div style="text-align:center;padding:20px 20px 16px;background:linear-gradient(135deg,#0b1220,#0f172a);border-radius:16px 16px 0 0;border-bottom:1px solid rgba(255,255,255,0.08);">
        <img src="https://res.cloudinary.com/djhuduvrr/image/upload/f_auto,q_auto,w_520/bitforge_logo1_tuzvyi.png" alt="BitForge" width="180" style="display:block;margin:0 auto 6px;" />
        <div style="font-size:15px;font-weight:700;color:#ffffff;">BitForge</div>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:32px 28px;border-radius:0 0 14px 14px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">

        <!-- Invoice badge -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
          <div>
            <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#6b7280;margin-bottom:4px;">TAX INVOICE</div>
            <h2 style="margin:0;font-size:22px;color:#111827;">Payment Confirmed ✓</h2>
            <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Hi <strong>${buyer?.name || 'there'}</strong>, your purchase was successful.</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#9ca3af;">Invoice</div>
            <div style="font-size:14px;font-weight:700;color:#6366f1;">#${invoiceNumber}</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${formattedDate}</div>
          </div>
        </div>

        <!-- Product box -->
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;color:#111827;">${productName}</div>
          ${productDescription ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;">${productDescription}</div>` : ''}
          <div style="font-size:11px;color:#9ca3af;margin-top:6px;">Digital download · BitForge Marketplace</div>
        </div>

        <!-- Price breakdown -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          ${row('Original price', `₹${Number(originalPrice).toFixed(2)}`)}
          ${discountPercent > 0 ? row(`Discount (${discountPercent}%)`, `-₹${Number(discountAmount).toFixed(2)}`) : ''}
          ${row('Price after discount', `₹${Number(priceAfterDiscount).toFixed(2)}`)}
          ${row(`GST (${gstPercent}%)`, `₹${Number(gstAmount).toFixed(2)}`)}
          ${row(`Platform fee (${platformFeePercent}%)`, `₹${Number(platformFee).toFixed(2)}`)}
          <tr><td colspan="2" style="border-top:2px solid #e5e7eb;padding-top:4px;"></td></tr>
          ${row('Total paid', `₹${Number(totalAmount).toFixed(2)}`, true)}
        </table>

        <!-- Payment info -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin-bottom:24px;">
          <div style="font-size:12px;color:#166534;font-weight:600;">Payment Successful</div>
          <div style="font-size:12px;color:#166534;margin-top:2px;">Method: ${paymentMethod || 'Razorpay'} · Ref: ${razorpayPaymentId || '—'}</div>
        </div>

        <a href="${ordersUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          View Your Purchases
        </a>

        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
          Questions? <a href="mailto:help@bittforge.in" style="color:#6366f1;text-decoration:none;">help@bittforge.in</a>
        </p>
      </div>

      <div style="text-align:center;margin-top:18px;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 BitForge. All rights reserved.</p>
        <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">This is an automated message. Please do not reply directly.</p>
      </div>

    </div>
  </div>
  `;

  return await resend.emails.send({
    from: getFromAddress(),
    to: buyer.email,
    replyTo: 'support@bitforge.com',
    subject,
    html,
  });
}

