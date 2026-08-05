import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderGreeting, renderPrimaryButton, renderAlertBox, renderSignature, renderSmallText } from './components.js';

/**
 * Password Reset Email
 * @param {Object} params
 * @param {string} params.resetUrl
 * @param {string} [params.name]
 */
export const renderResetPasswordEmail = ({ resetUrl, name }) => {
  const title = 'Reset your password';
  const subtitle = 'We received a request to reset the password for your Obliq account.';
  const preheader = 'Click the link to reset your Obliq account password. Valid for 1 hour.';

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderGreeting(name)}
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #94A3B8; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
      Click the button below to set a new password. This link will expire in
      <strong style="color: #F1F5F9;">1 hour</strong> for your security.
    </p>
    ${renderPrimaryButton({ text: 'Reset Password', url: resetUrl })}
    ${renderAlertBox({
      title: 'Didn\'t request this?',
      message: 'If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged.',
      type: 'info',
    })}
    ${renderSmallText(`Button not working? Copy and paste this link into your browser:<br/><a href="${resetUrl}" style="color: #4F8EF7; word-break: break-all;">${resetUrl}</a>`)}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
