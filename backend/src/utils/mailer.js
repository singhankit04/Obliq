import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  let transporterConfig;

  const emailUser = process.env.EMAIL;
  const emailPass = process.env.PASS;


  transporterConfig = {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  };

  transporter = nodemailer.createTransport(transporterConfig);
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const activeTransporter = await getTransporter();

    const fromName = process.env.NAME || 'Obliq';
    const fromEmail = process.env.EMAIL || 'noreply@obliq.com';

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
