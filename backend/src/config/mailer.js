import nodemailer from 'nodemailer';

const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL;
  const smtpPass = process.env.SMTP_PASS || process.env.PASS;

  return  nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const activeTransporter =getTransporter();

    const fromName = process.env.NAME;
    const fromEmail = process.env.EMAIL;
    console.log(fromEmail)

    const info = await activeTransporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);

    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Email sending failed');
  }
};