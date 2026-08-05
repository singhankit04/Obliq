/**
 * Obliq Base Email Layout — Premium Dark Edition
 * Single base layout wrapping all system email templates.
 * Compatible with Gmail, Outlook, Apple Mail, and Yahoo Mail.
 */
export const renderEmailLayout = ({ title, preheader, content }) => {
  const brandName = process.env.NAME || 'Obliq';
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@obliq.com';
  const companyUrl = process.env.APP_URL || 'https://obliq.com';
  const currentYear = new Date().getFullYear();

  // Inline SVG logo — Angular O with cut corner (matches favicon)
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" style="display:block;border-radius:9px;">
    <defs>
      <linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38BDF8"/>
        <stop offset="50%" stop-color="#6366F1"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="116" fill="#09090B"/>
    <path d="M 336,96 L 176,96 L 96,176 L 96,336 L 176,416 L 336,416 L 416,336 L 416,176 L 364,212 L 364,300 L 300,364 L 212,364 L 148,300 L 148,212 L 212,148 L 300,148 Z" fill="url(#eg)"/>
    <circle cx="328" cy="94" r="9" fill="#38BDF8" opacity="0.9"/>
    <circle cx="328" cy="94" r="4" fill="#FFFFFF"/>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title || brandName}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0F1117 !important; }
    body { font-family: Arial, Helvetica, sans-serif !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; }
    div[style*="margin: 16px 0"] { margin: 0 !important; }

    /* Dark mode overrides */
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #0F1117 !important; }
    }

    /* Mobile responsive */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 0 12px !important; }
      .card-body { padding: 28px 20px !important; }
      .header-cell { padding: 24px 0 18px 0 !important; }
      .footer-cell { padding: 24px 12px 20px 12px !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: #0F1117; color: #CBD5E1; font-family: Arial, Helvetica, sans-serif;">

  <!-- Invisible Preheader -->
  ${preheader ? `<div style="display:none;font-size:1px;color:#0F1117;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;</div>` : ''}

  <!-- Outer Wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F1117;">
    <tr>
      <td align="center" style="padding: 32px 0 48px 0;">

        <!-- Inner Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; margin: 0 auto;">

          <!-- ── Header / Brand ── -->
          <tr>
            <td align="center" class="header-cell" style="padding: 0 0 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="padding-right: 12px;">
                    ${logoSvg}
                  </td>
                  <td valign="middle">
                    <span style="font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.5px; font-family: Arial, Helvetica, sans-serif;">${brandName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Main Card ── -->
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                style="background-color: #16181D;
                       border: 1px solid #2A2D35;
                       border-radius: 16px;
                       overflow: hidden;">
                <tr>
                  <!-- Colored top accent bar -->
                  <td style="height: 3px; background: linear-gradient(90deg, #4F8EF7 0%, #6366F1 50%, #8B5CF6 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="card-body" style="padding: 36px 40px 40px 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td align="center" class="footer-cell" style="padding: 28px 20px 20px 20px; font-family: Arial, Helvetica, sans-serif;">
              <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #475569;">${brandName} &mdash; Modern Project Management</p>
              <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155;">
                <a href="mailto:${supportEmail}" style="color: #4F8EF7; text-decoration: none;">Support</a>
                &nbsp;&middot;&nbsp;
                <a href="${companyUrl}/privacy" style="color: #475569; text-decoration: none;">Privacy</a>
                &nbsp;&middot;&nbsp;
                <a href="${companyUrl}/terms" style="color: #475569; text-decoration: none;">Terms</a>
              </p>
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #334155;">You're receiving this because you have an account with ${brandName}.</p>
              <p style="margin: 0; font-size: 12px; color: #2A2D35;">&copy; ${currentYear} ${brandName}. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
};
