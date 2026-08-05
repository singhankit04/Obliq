/**
 * Obliq Email Design System — Premium Reusable Components
 * Dark, modern, minimal aesthetic inspired by Linear, Vercel, Notion, and Stripe.
 * Full inline CSS for Gmail, Outlook, Apple Mail, Yahoo Mail compatibility.
 */

const c = {
  // Background
  pageBg: '#0F1117',
  cardBg: '#16181D',
  cardBorder: '#2A2D35',
  innerBg: '#1C1F27',
  innerBorder: '#2E3240',

  // Brand
  primary: '#4F8EF7',
  primaryDark: '#2563EB',
  primaryGlow: 'rgba(79, 142, 247, 0.15)',
  accent: '#6366F1',

  // Text
  textHeading: '#F1F5F9',
  textBody: '#CBD5E1',
  textMuted: '#64748B',
  textSubtle: '#475569',

  // Semantic
  success: '#10B981',
  successBg: '#0D2218',
  successBorder: '#064E3B',
  warning: '#F59E0B',
  warningBg: '#1C1506',
  warningBorder: '#78350F',
  danger: '#EF4444',
  dangerBg: '#200C0C',
  dangerBorder: '#7F1D1D',
  info: '#4F8EF7',
  infoBg: '#0C1526',
  infoBorder: '#1E3A5F',
};

/**
 * Section heading block
 */
export const renderHeader = ({ title, subtitle }) => `
  <div style="margin: 0 0 28px 0;">
    ${title ? `<h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700; color: ${c.textHeading}; letter-spacing: -0.4px; line-height: 1.25; font-family: Arial, Helvetica, sans-serif;">${title}</h1>` : ''}
    ${subtitle ? `<p style="margin: 0; font-size: 15px; color: ${c.textMuted}; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">${subtitle}</p>` : ''}
  </div>
`;

/**
 * Greeting line
 */
export const renderGreeting = (name) => `
  <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: ${c.textHeading}; font-family: Arial, Helvetica, sans-serif;">
    Hey ${name ? name.split(' ')[0] : 'there'} 👋
  </p>
`;

/**
 * Primary CTA Button — vibrant blue with Outlook VML fallback
 */
export const renderPrimaryButton = ({ text, url }) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${url}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="16%" stroke="f" fillcolor="${c.primaryDark}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${text}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" target="_blank"
           style="background: linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%);
                  color: #ffffff;
                  display: inline-block;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 15px;
                  font-weight: 700;
                  line-height: 50px;
                  text-align: center;
                  text-decoration: none;
                  padding: 0 32px;
                  border-radius: 10px;
                  letter-spacing: 0.1px;
                  min-width: 180px;">
          ${text}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
`;

/**
 * Secondary (ghost) CTA Button
 */
export const renderSecondaryButton = ({ text, url }) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
    <tr>
      <td align="center">
        <a href="${url}" target="_blank"
           style="background-color: transparent;
                  color: ${c.primary};
                  display: inline-block;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 14px;
                  font-weight: 600;
                  line-height: 44px;
                  text-align: center;
                  text-decoration: none;
                  padding: 0 24px;
                  border-radius: 10px;
                  border: 1.5px solid ${c.cardBorder};">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

/**
 * Alert/Callout Box — info, success, warning, danger
 */
export const renderAlertBox = ({ message, type = 'info', title }) => {
  const styles = {
    info:    { bg: c.infoBg,    border: c.infoBorder,    accent: c.info,    icon: 'ℹ' },
    success: { bg: c.successBg, border: c.successBorder, accent: c.success, icon: '✓' },
    warning: { bg: c.warningBg, border: c.warningBorder, accent: c.warning, icon: '⚠' },
    danger:  { bg: c.dangerBg,  border: c.dangerBorder,  accent: c.danger,  icon: '✕' },
  };
  const s = styles[type] || styles.info;

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
      style="background-color: ${s.bg}; border: 1px solid ${s.border}; border-radius: 10px; margin: 24px 0;">
      <tr>
        <td style="padding: 4px 0 0 0; border-top: 3px solid ${s.accent}; border-radius: 10px 10px 0 0;"></td>
      </tr>
      <tr>
        <td style="padding: 16px 20px 18px 20px; font-family: Arial, Helvetica, sans-serif;">
          ${title ? `<p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: ${s.accent}; text-transform: uppercase; letter-spacing: 0.5px;">${title}</p>` : ''}
          <p style="margin: 0; font-size: 14px; color: ${c.textBody}; line-height: 1.6;">${message}</p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Centered OTP Code Box — monospace, dramatic
 */
export const renderOtpBox = (code) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
    style="background-color: ${c.innerBg}; border: 1px solid ${c.innerBorder}; border-radius: 12px; margin: 28px 0;">
    <tr>
      <td align="center" style="padding: 32px 24px;">
        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: ${c.textMuted}; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">Verification Code</p>
        <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: ${c.textHeading}; line-height: 1.2;">${code}</p>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${c.textMuted}; font-family: Arial, Helvetica, sans-serif;">Expires in 10 minutes · Do not share</p>
      </td>
    </tr>
  </table>
`;

/**
 * Key-Value Details Card
 */
export const renderMetaTable = (items = []) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
    style="background-color: ${c.innerBg}; border: 1px solid ${c.innerBorder}; border-radius: 10px; margin: 24px 0;">
    ${items.map(({ label, value }, i) => `
      <tr>
        <td colspan="2" style="padding: 0 20px;">
          <div style="${i > 0 ? `border-top: 1px solid ${c.cardBorder};` : ''} padding: 12px 0;">
            <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 600; color: ${c.textMuted}; text-transform: uppercase; letter-spacing: 0.6px; font-family: Arial, Helvetica, sans-serif;">${label}</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${c.textHeading}; font-family: Arial, Helvetica, sans-serif;">${value}</p>
          </div>
        </td>
      </tr>
    `).join('')}
  </table>
`;

/**
 * Horizontal Divider
 */
export const renderDivider = () => `
  <div style="border-top: 1px solid ${c.cardBorder}; margin: 28px 0;"></div>
`;

/**
 * Signature block
 */
export const renderSignature = () => `
  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${c.cardBorder}; font-family: Arial, Helvetica, sans-serif;">
    <p style="margin: 0 0 2px 0; font-size: 14px; color: ${c.textMuted};">With ♥,</p>
    <p style="margin: 0; font-size: 15px; font-weight: 700; color: ${c.textHeading};">The Obliq Team</p>
  </div>
`;

/**
 * Small muted note
 */
export const renderSmallText = (text) => `
  <p style="margin: 20px 0 0 0; font-size: 13px; color: ${c.textMuted}; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
    ${text}
  </p>
`;

/**
 * Comment Blockquote Card
 */
export const renderQuoteBlock = (text, author) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
    style="background-color: ${c.innerBg}; border: 1px solid ${c.innerBorder}; border-left: 3px solid ${c.primary}; border-radius: 0 10px 10px 0; margin: 24px 0;">
    <tr>
      <td style="padding: 18px 20px; font-family: Arial, Helvetica, sans-serif;">
        <p style="margin: 0 0 8px 0; font-size: 15px; color: ${c.textBody}; line-height: 1.65; font-style: italic;">"${text}"</p>
        ${author ? `<p style="margin: 0; font-size: 12px; font-weight: 600; color: ${c.textMuted};">— ${author}</p>` : ''}
      </td>
    </tr>
  </table>
`;

/**
 * Feature/Highlight Card strip (icon + text)
 */
export const renderFeatureRow = (items = []) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    ${items.map(({ icon, label, desc }) => `
      <tr>
        <td width="36" valign="top" style="padding: 4px 12px 16px 0;">
          <div style="width: 32px; height: 32px; background-color: ${c.innerBg}; border: 1px solid ${c.innerBorder}; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">${icon}</div>
        </td>
        <td valign="top" style="padding-bottom: 16px; font-family: Arial, Helvetica, sans-serif;">
          <p style="margin: 0 0 3px 0; font-size: 14px; font-weight: 700; color: ${c.textHeading};">${label}</p>
          ${desc ? `<p style="margin: 0; font-size: 13px; color: ${c.textMuted}; line-height: 1.5;">${desc}</p>` : ''}
        </td>
      </tr>
    `).join('')}
  </table>
`;
