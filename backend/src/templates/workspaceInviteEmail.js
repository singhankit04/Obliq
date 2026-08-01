import { renderEmailLayout } from './emailLayout.js';

/**
 * Renders HTML email template for Workspace Invitations
 * @param {Object} params
 * @param {string} params.inviterName - Name of person sending invitation
 * @param {string} params.workspaceName - Name of workspace
 * @param {string} params.role - Member role (e.g. manager, member)
 * @param {string} params.acceptUrl - Complete URL to accept invitation
 * @param {string} params.rejectUrl - Complete URL to reject invitation
 * @returns {string} Fully formatted HTML string
 */
export const renderWorkspaceInviteEmail = ({
  inviterName,
  workspaceName,
  role,
  acceptUrl,
  rejectUrl,
}) => {
  const brand = process.env.NAME || 'Obliq';
  const title = `Invitation to join ${workspaceName} on ${brand}`;
  const preheader = `${inviterName} invited you to join the workspace "${workspaceName}".`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; text-align: center; letter-spacing: -0.5px;">
      You've been invited! 🎉
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; text-align: center;">
      <strong>${inviterName}</strong> has invited you to collaborate in the workspace <strong style="color: #4f46e5;">${workspaceName}</strong> as a <strong>${role}</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1e293b;">
        Workspace: <span style="color: #4f46e5;">${workspaceName}</span>
      </p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        Assigned Role: <span style="text-transform: capitalize; font-weight: 600; color: #334155;">${role}</span>
      </p>
    </div>

    <!-- Action Buttons -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-right: 10px;">
                <a href="${acceptUrl}" target="_blank" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; display: inline-block; padding: 12px 26px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                  Accept Invitation
                </a>
              </td>
              <td align="center" style="padding-left: 10px;">
                <a href="${rejectUrl}" target="_blank" style="background-color: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; display: inline-block; padding: 12px 26px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none;">
                  Decline
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
        This invitation link will expire in 7 days.
      </p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        If button links don't work, copy and paste the Accept URL into your browser:<br>
        <a href="${acceptUrl}" style="color: #6366f1; word-break: break-all;">${acceptUrl}</a>
      </p>
    </div>
  `;

  return renderEmailLayout({ title, preheader, content });
};
