import { renderEmailLayout } from './emailLayout.js';

/**
 * Renders an HTML email template for Welcome Email on successful signup
 * @param {Object} params
 * @param {string} params.name - User's name
 * @returns {string} Fully formatted HTML string
 */
export const renderWelcomeEmail = ({ name }) => {
  const brand = process.env.NAME || 'Obliq';
  const title = `Welcome to ${brand}! 🎉`;
  const preheader = `We're excited to have you on board, ${name}!`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #0f172a; text-align: center; letter-spacing: -0.5px;">
      Welcome aboard, ${name}! 👋
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6; text-align: center;">
      Thank you for creating your <strong>${brand}</strong> account. We are thrilled to have you with us.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #334155;">
        Ready to get started?
      </p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        Log in to your dashboard to explore features and customize your account.
      </p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        If you have any questions or feedback, feel free to reply to this email!
      </p>
    </div>
  `;

  return renderEmailLayout({ title, preheader, content });
};
