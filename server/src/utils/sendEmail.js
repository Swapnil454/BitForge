import { Resend } from "resend";

// Initialize Resend client lazily
let resendClient = null;

const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

export const sendOtpEmail = async (email, otp, type = 'Email Verification') => {
  const resend = getResendClient();

  // Validate required environment variables
  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL environment variable is not set');
  }

  if (!email) {
    throw new Error('Email address is required');
  }

  const isPasswordReset = type === 'Password Reset';
  const isAccountDeletion = type === 'Account Deletion';

  const subject = isPasswordReset
    ? "Reset your BitForge password"
    : isAccountDeletion
    ? "Account deletion confirmation"
    : "Verify your BitForge email";

  const html = `
  <div style="background:#f3f4f6;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#082453;padding:16px;text-align:center;">
         <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;font-style:italic;">BitForge</div>
      </div>

      <!-- Body -->
      <div style="padding:24px 20px;text-align:center;">
        <h2 style="margin:0 0 12px 0;font-size:22px;color:#111827;font-weight:700;">
          ${ isPasswordReset ? "Reset Password" : isAccountDeletion ? "Account Deletion" : "Verify Email" }
        </h2>

        <p style="margin:0 0 24px 0;font-size:14px;color:#6b7280;line-height:1.6;">
          ${ isPasswordReset ? "You requested to reset your BitForge password. Use the code below to continue." : isAccountDeletion ? "You requested to delete your BitForge account. Enter the code below to confirm." : "Welcome to BitForge! Enter the verification code below to complete your signup." }
        </p>

        <!-- OTP Box -->
        <div style="margin-bottom:24px;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;letter-spacing:1px;">
            ${ isPasswordReset ? "PASSWORD RESET CODE" : isAccountDeletion ? "ACCOUNT DELETION CODE" : "VERIFICATION CODE" }
          </p>
          <div style="font-size:32px;font-weight:700;color:#111827;letter-spacing:6px;background:#f9fafb;border:1px solid #e5e7eb;padding:12px 20px;border-radius:8px;display:inline-block;">
            ${otp}
          </div>
        </div>

        <div style="border-top:1px solid #e5e7eb;margin-bottom:20px;"></div>

        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
          This code expires in 10 minutes.<br/>
          ${ isPasswordReset ? "If you didn't request a password reset, you can safely ignore this email." : isAccountDeletion ? "If you didn't request account deletion, ignore this email." : "If you didn't create an account, you can safely ignore this email." }
        </p>
      </div>

    </div>
    
    <div style="max-width:600px;margin:20px auto 0;text-align:center;font-size:12px;color:#6b7280;line-height:1.6;">
      <p style="margin:0;">Need help? Contact us at <a href="mailto:help@bittforge.in" style="color:#2563eb;text-decoration:none;">help@bittforge.in</a></p>
      <p style="margin:6px 0 0;font-size:11px;">© 2026 BitForge. All rights reserved.</p>
    </div>
  </div>
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject,
    html,
  });
};

export const sendInvoiceEmail = async (email, invoiceData, pdfBuffer) => {
  const resend = getResendClient();

  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL environment variable is not set');
  }

  const subject = `Your BitForge Order - ${invoiceData.productName}`;

  const html = `
  <div style="background:#0b0f1a;padding:40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;">
      <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#0b1220,#111827);border-radius:16px 16px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:24px;">BitForge</h1>
      </div>
      <div style="background:#ffffff;padding:32px 28px;border-radius:0 0 14px 14px;">
        <h2 style="margin:0 0 12px 0;font-size:22px;color:#111827;">Thank you for your purchase!</h2>
        <p style="margin:0 0 24px 0;font-size:15px;color:#4b5563;line-height:1.6;">
          Hi ${invoiceData.buyerName},<br><br>
          Your payment for <strong>${invoiceData.productName}</strong> was successful. 
          You can find your digital invoice attached to this email.
        </p>
        <p style="margin:0;font-size:14px;color:#6b7280;">
          Need help? Contact us at <a href="mailto:support@bittforge.in" style="color:#6366f1;text-decoration:none;">support@bittforge.in</a>
        </p>
      </div>
    </div>
  </div>
  `;

  // Filename format: product name(first)+invoice.pdf
  const firstWord = invoiceData.productName ? invoiceData.productName.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "") : "BitForge";
  const filename = `${firstWord}_invoice.pdf`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject,
    html,
    attachments: [
      {
        filename: filename,
        content: pdfBuffer
      }
    ]
  });
};
