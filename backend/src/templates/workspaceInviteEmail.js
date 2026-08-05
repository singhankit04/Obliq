import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderMetaTable, renderPrimaryButton, renderSignature, renderSmallText } from './components.js';

/**
 * Workspace Invitation Email
 * @param {Object} params
 * @param {string} params.inviterName
 * @param {string} params.workspaceName
 * @param {string} params.inviteUrl
 * @param {string} [params.role='Member']
 */
export const renderWorkspaceInviteEmail = ({ inviterName, workspaceName, inviteUrl, role = 'Member' }) => {
  const title = `You're invited to ${workspaceName}`;
  const subtitle = `${inviterName || 'A teammate'} has invited you to collaborate on Obliq.`;
  const preheader = `${inviterName} invited you to join ${workspaceName} on Obliq as ${role}.`;

  const content = `
    ${renderHeader({ title, subtitle })}
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #94A3B8; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
      <strong style="color: #F1F5F9;">${inviterName || 'Someone'}</strong> has invited you to join their workspace on Obliq.
      Accept the invitation to access shared projects, tasks, and team discussions.
    </p>
    ${renderMetaTable([
      { label: 'Workspace', value: workspaceName },
      { label: 'Invited By', value: inviterName || 'Workspace Admin' },
      { label: 'Your Role', value: role },
    ])}
    ${renderPrimaryButton({ text: 'Accept Invitation', url: inviteUrl })}
    ${renderSmallText(`No Obliq account yet? Clicking the button above will let you create one in seconds.<br/><br/>
      Or paste this link in your browser:<br/>
      <a href="${inviteUrl}" style="color: #4F8EF7; word-break: break-all;">${inviteUrl}</a>`)}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
