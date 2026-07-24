import { renderEmailLayout } from './emailLayout.js';

/**
 * Renders an HTML email template for OTP Verification (Signup or Login)
 * @param {Object} params
 * @param {string} params.otp - The numeric/alphanumeric OTP code
 * @param {'signup' | 'login'} [params.type='signup'] - The verification type
 * @returns {string} Fully formatted HTML string
 */
export const renderOtpEmail = ({ otp, type = 'signup' }) => {
  const isLogin = type === 'login';
  const title = isLogin ? 'Login Verification Code' : 'Verify Your Email';
  const actionText = isLogin ? 'log in to your Obliq account' : 'complete your Obliq registration';
  const preheader = `Your ${brandName()} verification code is ${otp}. It expires in 10 minutes.`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #0f172a; text-align: center; letter-spacing: -0.5px;">
      ${title}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6; text-align: center;">
      Please use the single-use verification code below to ${actionText}:
    </p>

    <!-- OTP Code Display Box -->
    <div style="margin: 28px 0; text-align: center;">
      <div class="otp-code" style="display: inline-block; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px 28px; font-size: 34px; font-weight: 800; font-family: 'Courier New', Courier, monospace; color: #4f46e5; letter-spacing: 8px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);">
        ${otp}
      </div>
    </div>

    <!-- Timer / Expiry Notice -->
    <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
        ⏱️ This verification code will expire in <strong>10 minutes</strong>.
      </p>
    </div>

    <!-- Security Alert -->
    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
        If you did not request this verification code, please ignore this email or contact support if you suspect unauthorized activity.
      </p>
    </div>
  `;

  return renderEmailLayout({ title, preheader, content });
};

function brandName() {
  return process.env.NAME || 'Obliq';
}
