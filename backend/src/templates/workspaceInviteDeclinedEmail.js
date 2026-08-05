import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderMetaTable, renderAlertBox, renderSecondaryButton, renderSignature } from './components.js';

/**
 * Workspace Invitation Declined Notification
 * @param {Object} params
 * @param {string} [params.inviteeName]
 * @param {string} params.inviteeEmail
 * @param {string} params.workspaceName
 */
export const renderWorkspaceInviteDeclinedEmail = ({ inviteeName, inviteeEmail, workspaceName }) => {
  const title = 'Invitation declined';
  const subtitle = `${inviteeName || inviteeEmail} declined to join ${workspaceName}.`;
  const preheader = `${inviteeName || inviteeEmail} declined your invitation to join ${workspaceName}.`;
  const appUrl = process.env.APP_URL || 'https://obliq.com';

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderAlertBox({
      title: 'Invitation not accepted',
      message: `<strong>${inviteeName || inviteeEmail}</strong> has declined the invitation to join <strong>${workspaceName}</strong>. You can resend the invitation anytime from Workspace Settings.`,
      type: 'info',
    })}
    ${renderMetaTable([
      { label: 'User', value: inviteeName || inviteeEmail },
      { label: 'Email', value: inviteeEmail },
      { label: 'Workspace', value: workspaceName },
      { label: 'Status', value: '✕ Declined' },
    ])}
    ${renderSecondaryButton({ text: 'Go to Workspace Settings', url: `${appUrl}/settings/members` })}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
