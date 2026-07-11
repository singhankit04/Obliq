import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  let transporterConfig;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  } else {
    console.log('Generating Ethereal SMTP credentials for development...');
    const account = await nodemailer.createTestAccount();
    transporterConfig = {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    };
  }

  transporter = nodemailer.createTransport(transporterConfig);
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const activeTransporter = await getTransporter();

    const fromName = process.env.SMTP_FROM_NAME || 'Obliq';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@obliq.com';

    const info = await activeTransporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Email sending failed');
  }
};
