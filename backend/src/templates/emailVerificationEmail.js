import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderGreeting, renderPrimaryButton, renderAlertBox, renderSignature, renderSmallText } from './components.js';

/**
 * Email Verification Email
 * @param {Object} params
 * @param {string} params.verifyUrl
 * @param {string} [params.name]
 */
export const renderEmailVerificationEmail = ({ verifyUrl, name }) => {
  const title = 'Verify your email address';
  const subtitle = 'One quick step to activate your Obliq account.';
  const preheader = 'Click the link to verify your email address and start using Obliq.';

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderGreeting(name)}
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #94A3B8; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
      Thanks for signing up! Please confirm your email address to unlock full access to your workspace and start collaborating with your team.
    </p>
    ${renderPrimaryButton({ text: 'Verify Email Address', url: verifyUrl })}
    ${renderAlertBox({
      title: 'Link expires in 24 hours',
      message: 'For security, this verification link will expire in 24 hours. Request a new one from the app if needed.',
      type: 'info',
    })}
    ${renderSmallText(`Button not working? Copy and paste this link:<br/><a href="${verifyUrl}" style="color: #4F8EF7; word-break: break-all;">${verifyUrl}</a>`)}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
