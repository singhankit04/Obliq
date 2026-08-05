import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderOtpBox, renderAlertBox, renderSignature } from './components.js';

/**
 * OTP / Verification Code Email
 * @param {Object} params
 * @param {string} params.otp - The OTP code
 * @param {'signup' | 'login'} [params.type='signup']
 */
export const renderOtpEmail = ({ otp, type = 'signup' }) => {
  const isLogin = type === 'login';
  const title = isLogin ? 'Your login code' : 'Please Verify your email';
  const subtitle = isLogin
    ? 'Use the code below to securely log in to your Obliq account.'
    : 'Use the code below to complete your Obliq registration.';
  const preheader = `Your Obliq verification code: ${otp} — valid for 10 minutes.`;

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderOtpBox(otp)}
    ${renderAlertBox({
      title: 'Security Notice',
      message: 'This code is single-use and expires in 10 minutes. Never share it with anyone, including Obliq support.',
      type: 'warning',
    })}
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #475569; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      If you didn't request this code, you can safely ignore this email. Your account is not at risk.
    </p>
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
