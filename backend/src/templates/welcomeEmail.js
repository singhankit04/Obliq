import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderGreeting, renderPrimaryButton, renderFeatureRow, renderSignature } from './components.js';

/**
 * Welcome Email — sent on new account creation
 * @param {Object} params
 * @param {string} [params.name]
 * @param {string} [params.actionUrl]
 */
export const renderWelcomeEmail = ({ name, actionUrl }) => {
  const brandName = process.env.NAME || 'Obliq';
  const appUrl = actionUrl || process.env.APP_URL || 'https://obliq.com';
  const title = `Welcome to ${brandName}`;
  const subtitle = 'Your workspace is ready. Let\'s ship something great.';
  const preheader = `Hey ${name ? name.split(' ')[0] : 'there'}, welcome to ${brandName}! Your workspace is ready.`;

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderGreeting(name)}
    <p style="margin: 0 0 28px 0; font-size: 15px; color: #94A3B8; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
      We're thrilled to have you on board. ${brandName} is built to help teams
      <strong style="color: #F1F5F9;">ship faster</strong>,
      <strong style="color: #F1F5F9;">stay organized</strong>, and
      <strong style="color: #F1F5F9;">collaborate seamlessly</strong> — all in one place.
    </p>
    ${renderFeatureRow([
      { icon: '📋', label: 'Create your first project', desc: 'Organize tasks, set deadlines, and track progress in one view.' },
      { icon: '👥', label: 'Invite your team', desc: 'Collaborate in real time with workspace invitations.' },
      { icon: '⚡', label: 'Move fast', desc: 'Use keyboard shortcuts, filters, and priority views to stay in flow.' },
    ])}
    ${renderPrimaryButton({ text: 'Open Your Dashboard', url: appUrl })}
    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Need help? Just reply to this email or visit our support center.
    </p>
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
