import { renderEmailLayout } from './emailLayout.js';

/**
 * Renders HTML email template sent to the acceptor upon successfully joining a workspace
 * @param {Object} params
 * @param {string} params.userName - Name of user who accepted invitation
 * @param {string} params.workspaceName - Name of workspace joined
 * @param {string} params.role - Role assigned in workspace
 * @param {string} params.workspaceUrl - Direct link to open workspace in app
 * @returns {string} Fully formatted HTML string
 */
export const renderWorkspaceInviteAcceptedEmail = ({
  userName,
  workspaceName,
  role,
  workspaceUrl,
}) => {
  const brand = process.env.NAME || 'Obliq';
  const title = `Welcome to ${workspaceName} on ${brand}!`;
  const preheader = `You have successfully joined the workspace "${workspaceName}".`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; text-align: center; letter-spacing: -0.5px;">
      Welcome to ${workspaceName}! 🚀
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; text-align: center;">
      Hi <strong>${userName}</strong>, your workspace invitation has been accepted. You are now a <strong>${role}</strong> in <strong>${workspaceName}</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1e293b;">
        Workspace: <span style="color: #4f46e5;">${workspaceName}</span>
      </p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">
        Your Role: <span style="text-transform: capitalize; font-weight: 600; color: #334155;">${role}</span>
      </p>
    </div>

    <!-- Go to Workspace Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <a href="${workspaceUrl}" target="_blank" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; display: inline-block; padding: 13px 30px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
            Open Workspace
          </a>
        </td>
      </tr>
    </table>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        You can now view projects, collaborate on tasks, and communicate with your team.
      </p>
    </div>
  `;

  return renderEmailLayout({ title, preheader, content });
};
