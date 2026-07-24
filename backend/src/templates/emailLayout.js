/**
 * Base Email Layout Wrapper
 * Renders a responsive, modern HTML email structure compatible with all major email clients.
 */
export const renderEmailLayout = ({ title, preheader, content }) => {
  const brandName = process.env.NAME || 'Obliq';
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* iOS Blue Links */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    
    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 16px !important;
      }
      .content-card {
        padding: 24px 20px !important;
      }
      .otp-code {
        font-size: 28px !important;
        letter-spacing: 6px !important;
        padding: 14px 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; color: #334155;">
  <!-- Preheader text (invisible preview text in email clients) -->
  ${preheader ? `<div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}

  <!-- Main Wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 560px; margin: 0 auto; padding: 0 16px;">
          
          <!-- Header / Brand -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); width: 48px; height: 48px; border-radius: 12px; display: inline-block; text-align: center; line-height: 48px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                      <span style="color: #ffffff; font-size: 24px; font-weight: 800; font-family: Arial, sans-serif;">O</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <span style="font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">${brandName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="content-card" style="background-color: #ffffff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0;">
                <tr>
                  <td>
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px; padding-bottom: 16px; font-size: 13px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">This email was sent by <strong>${brandName}</strong>. If you did not request this email, please secure your account immediately.</p>
              <p style="margin: 0;">&copy; ${currentYear} ${brandName}. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
