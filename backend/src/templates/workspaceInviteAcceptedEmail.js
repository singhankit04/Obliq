import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderMetaTable, renderPrimaryButton, renderAlertBox, renderSignature } from './components.js';

/**
 * Workspace Invitation Accepted Notification
 * @param {Object} params
 * @param {string} [params.inviteeName]
 * @param {string} params.inviteeEmail
 * @param {string} params.workspaceName
 * @param {string} [params.workspaceUrl]
 */
export const renderWorkspaceInviteAcceptedEmail = ({ inviteeName, inviteeEmail, workspaceName, workspaceUrl }) => {
  const brandName = process.env.NAME || 'Obliq';
  const url = workspaceUrl || process.env.APP_URL || 'https://obliq.com';
  const displayName = inviteeName || inviteeEmail;
  const title = 'Invitation accepted';
  const subtitle = `${displayName} has joined ${workspaceName}.`;
  const preheader = `${displayName} accepted your invitation and joined ${workspaceName} on ${brandName}.`;

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderAlertBox({
      title: 'New member joined',
      message: `${displayName} has accepted your invitation and is now an active member of <strong>${workspaceName}</strong>.`,
      type: 'success',
    })}
    ${renderMetaTable([
      { label: 'Member', value: inviteeName || inviteeEmail },
      { label: 'Email', value: inviteeEmail },
      { label: 'Workspace', value: workspaceName },
      { label: 'Status', value: '✓ Active' },
    ])}
    ${renderPrimaryButton({ text: 'Open Workspace', url })}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
