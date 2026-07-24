import { renderEmailLayout } from './emailLayout.js';

/**
 * Renders an HTML email template for Password Reset
 * @param {Object} params
 * @param {string} params.resetUrl - The absolute password reset link
 * @returns {string} Fully formatted HTML string
 */
export const renderResetPasswordEmail = ({ resetUrl }) => {
  const brandName = process.env.NAME || 'Obliq';
  const title = 'Reset Your Password';
  const preheader = `Reset your ${brandName} password using the secure link inside. Valid for 15 minutes.`;

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="width: 56px; height: 56px; background-color: #eef2ff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto;">
        <span style="font-size: 26px;">🔒</span>
      </div>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #0f172a; text-align: center; letter-spacing: -0.5px;">
      Password Reset Request
    </h2>
    <p style="margin: 0 0 28px 0; font-size: 15px; color: #475569; line-height: 1.6; text-align: center;">
      We received a request to reset the password for your <strong>${brandName}</strong> account. Click the button below to choose a new password:
    </p>

    <!-- Primary Action Button -->
    <div style="margin: 32px 0; text-align: center;">
      <a href="${resetUrl}" target="_blank" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); transition: all 0.2s ease;">
        Reset Password
      </a>
    </div>

    <!-- Timer / Expiry Notice -->
    <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
        ⏱️ This password reset link is valid for <strong>15 minutes</strong> only.
      </p>
    </div>

    <!-- Fallback Link -->
    <div style="background-color: #fafafa; border: 1px solid #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; word-break: break-all;">
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        Button not working? Copy & paste link below:
      </p>
      <a href="${resetUrl}" style="font-size: 13px; color: #4f46e5; text-decoration: underline;">
        ${resetUrl}
      </a>
    </div>

    <!-- Security Alert -->
    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  return renderEmailLayout({ title, preheader, content });
};
