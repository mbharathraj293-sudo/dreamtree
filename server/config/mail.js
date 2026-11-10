import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ Mail service verification failed. Emails will log to terminal fallback. Error:', error.message);
  } else {
    console.log('✅ SMTP Mail service ready to send email notifications.');
  }
});

export default transporter;
