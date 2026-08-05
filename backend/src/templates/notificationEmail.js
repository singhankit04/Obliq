import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderGreeting, renderAlertBox, renderPrimaryButton, renderSignature } from './components.js';

/**
 * Generic Notification Email
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.actionText]
 * @param {string} [params.actionUrl]
 * @param {string} [params.name]
 * @param {'info'|'success'|'warning'|'danger'} [params.alertType]
 * @param {string} [params.alertTitle]
 */
export const renderNotificationEmail = ({ title, message, actionText, actionUrl, name, alertType, alertTitle }) => {
  const brandName = process.env.NAME || 'Obliq';
  const headerTitle = title || `Notification from ${brandName}`;
  const preheader = (message || headerTitle).substring(0, 120);

  const content = `
    ${renderHeader({ title: headerTitle })}
    ${renderGreeting(name)}
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #94A3B8; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
      ${message}
    </p>
    ${alertType ? renderAlertBox({ title: alertTitle, message, type: alertType }) : ''}
    ${actionText && actionUrl ? renderPrimaryButton({ text: actionText, url: actionUrl }) : ''}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title: headerTitle, preheader, content });
};
