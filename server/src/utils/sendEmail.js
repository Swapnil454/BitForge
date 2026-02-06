

import sgMail from "@sendgrid/mail";

// Initialize SendGrid API key when the module is used, not when imported
const initializeSendGrid = () => {
  if (!sgMail.apiKey) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }
    
    if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      throw new Error('SENDGRID_API_KEY must start with "SG."');
    }
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
};

export const sendOtpEmail = async (email, otp, type = 'Email Verification') => {
  // Initialize SendGrid when actually needed
  initializeSendGrid();
  
  // Validate required environment variables
  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('SENDGRID_FROM_EMAIL environment variable is not set');
  }
  
  if (!email) {
    throw new Error('Email address is required');
  }
  
  const isPasswordReset = type === 'Password Reset';
  const isAccountDeletion = type === 'Account Deletion';

  const msg = {
  to: email,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: isPasswordReset
    ? "Reset your BitForge password"
    : isAccountDeletion
    ? "Account deletion confirmation"
    : "Verify your BitForge email",

  html: `
  <div style="background:#0b0f1a;padding:40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;">

      <!-- Header -->
      <div style="
        text-align:center;
        padding:20px 20px 18px;
        background:linear-gradient(135deg,#0b1220,#111827);
        border-radius:16px 16px 0 0;
        border-bottom:1px solid rgba(255,255,255,0.08);
      ">

        <!-- Logo glass container -->
        <div style="
          text-align:center;
          padding:16px 20px 12px;
          background:linear-gradient(135deg,#0b1220,#0f172a);
          border-radius:16px 16px 0 0;
          border-bottom:1px solid rgba(255,255,255,0.08);
        ">

          <img
            src="https://res.cloudinary.com/djhuduvrr/image/upload/f_auto,q_auto,w_520/bitforge_logo1_tuzvyi.png"
            alt="BitForge"
            width="220"
            style="
              display:block;
              margin:0 auto 2px;
              line-height:0;
            "
          />

          <div style="
            font-size:16px;
            font-weight:700;
            letter-spacing:0.3px;
            color:#ffffff;
            line-height:1;
          ">
            BitForge
          </div>

        </div>

      </div>


      <!-- Body -->
      <div style="background:#ffffff;padding:32px 28px;border-radius:0 0 14px 14px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">

        <h2 style="margin:0 0 12px 0;font-size:22px;color:#111827;">
          ${
            isPasswordReset
              ? "Reset your BitForge password"
              : isAccountDeletion
              ? "Account deletion confirmation"
              : "Verify your BitForge email"
          }
        </h2>

        <p style="margin:0 0 24px 0;font-size:15px;color:#4b5563;line-height:1.6;">
          ${
            isPasswordReset
              ? "You requested to reset your BitForge password. Use the code below to continue."
              : isAccountDeletion
              ? "You requested to delete your BitForge account. Enter the code below to confirm."
              : "Welcome to BitForge! Enter the verification code below to complete your signup."
          }
        </p>

        <!-- OTP Box -->
        <div style="background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#6b7280;letter-spacing:1px;">
            ${
              isPasswordReset
                ? "PASSWORD RESET CODE"
                : isAccountDeletion
                ? "ACCOUNT DELETION CODE"
                : "VERIFICATION CODE"
            }
          </p>
          <div style="font-size:34px;font-weight:700;color:#111827;letter-spacing:10px;">
            ${otp}
          </div>
        </div>

        <!-- Warning -->
        <div style="background:#fff7ed;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:8px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
            <strong>Important:</strong> This code expires in <strong>10 minutes</strong>.
            ${
              isPasswordReset
                ? " If you didn’t request a password reset, you can safely ignore this email."
                : isAccountDeletion
                ? " If you didn’t request account deletion, ignore this email."
                : " If you didn’t create an account, you can ignore this email."
            }
          </p>
        </div>

        <!-- Support -->
        <p style="margin:0;font-size:14px;color:#6b7280;">
          Need help? Contact us at
          <a href="mailto:help@bittforge.in" style="color:#6366f1;text-decoration:none;">
            help@bittforge.in
          </a>
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:18px;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          © 2026 BitForge. All rights reserved.
        </p>
        <p style="margin:6px 0 0 0;font-size:11px;color:#6b7280;">
          This is an automated message. Please do not reply.
        </p>
      </div>

    </div>
  </div>
  `,
};


  await sgMail.send(msg);
};
