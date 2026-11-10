import transporter from '../config/mail.js';
import logger from '../utils/logger.js';

const BRAND_NAME = 'The Dreaming Tree';
const BRAND_PRIMARY = '#0F3D2E';
const BRAND_ACCENT = '#D4A017';
const FROM_EMAIL = process.env.SMTP_FROM || 'no-reply@thedreamingtree.in';

const wrapTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Montserrat', 'Poppins', sans-serif; background-color: #F8F6F1; color: #1C1C1C; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border: 1px solid #EAE5DB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 61, 46, 0.05); }
    .header { background-color: ${BRAND_PRIMARY}; padding: 30px; text-align: center; border-bottom: 3px solid ${BRAND_ACCENT}; }
    .header h1 { color: #F8F6F1; margin: 0; font-size: 24px; font-family: 'Playfair Display', serif; }
    .content { padding: 40px 30px; line-height: 1.6; font-size: 15px; }
    .cta-btn { display: inline-block; background-color: ${BRAND_ACCENT}; color: ${BRAND_PRIMARY} !important; text-decoration: none; padding: 12px 30px; border-radius: 999px; font-weight: bold; margin: 20px 0; text-transform: uppercase; font-size: 13px; letter-spacing: 1.5px; }
    .footer { background-color: #F3F1EB; padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #EAE5DB; }
    .otp-code { font-size: 32px; letter-spacing: 6px; font-weight: bold; color: ${BRAND_PRIMARY}; text-align: center; margin: 20px 0; background: #F8F6F1; padding: 15px; border-radius: 8px; border: 1px dashed ${BRAND_ACCENT}; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🌳 The Dreaming Tree</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; 2026 The Dreaming Tree Restaurant. All Rights Reserved.<br>
      Plot No 11, 12, Chengam Rd 4th St, VIP Garden, Tiruvannamalai
    </div>
  </div>
</body>
</html>
`;

export const sendOTPEmail = async (email, name, otp) => {
  const content = `
    <p>Dear ${name},</p>
    <p>Thank you for logging in to your manager dashboard at <strong>The Dreaming Tree</strong>.</p>
    <p>Please enter the following verification OTP code to complete your sign-in process. This code is valid for 10 minutes.</p>
    <div class="otp-code">${otp}</div>
    <p>If you did not initiate this login attempt, please change your password immediately.</p>
  `;

  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: `Verification Code: ${otp} - The Dreaming Tree`,
      html: wrapTemplate(content)
    });
    logger.info(`OTP Email successfully sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send OTP Email to ${email}: ${error.message}`);
  }
};

export const sendResetEmail = async (email, name, token) => {
  const resetLink = `http://localhost:5000/admin/reset-password.html?token=${token}`;
  const content = `
    <p>Dear ${name},</p>
    <p>We received a request to reset your password for your <strong>The Dreaming Tree</strong> account.</p>
    <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
    <div style="text-align: center;">
      <a href="${resetLink}" class="cta-btn">Reset Password</a>
    </div>
    <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
  `;

  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: `Reset Password Request - The Dreaming Tree`,
      html: wrapTemplate(content)
    });
    logger.info(`Password reset email successfully sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
  }
};

export const sendReservationEmail = async (email, name, reservation) => {
  const formattedDate = new Date(reservation.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <p>Dear ${name},</p>
    <p>We are delighted to inform you that your dining sanctuary booking at <strong>The Dreaming Tree</strong> has been received!</p>
    <h3 style="color: ${BRAND_PRIMARY}; border-bottom: 1px solid #EAE5DB; padding-bottom: 8px;">Reservation Summary</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; font-weight: bold;">Date:</td>
        <td style="padding: 6px 0;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: bold;">Time Slot:</td>
        <td style="padding: 6px 0;">${reservation.timeSlot}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: bold;">Guests Count:</td>
        <td style="padding: 6px 0;">${reservation.guests} Guests</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: bold;">Status:</td>
        <td style="padding: 6px 0; color: ${BRAND_ACCENT}; font-weight: bold;">${reservation.status}</td>
      </tr>
    </table>
    <p>Seating in our elevated treehouse deck is limited. Please arrive 10 minutes prior to your reservation time. If you need to make changes, please contact us at +91 95859 46599.</p>
    <p>We look forward to welcoming you soon!</p>
  `;

  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: `Table Booking Update: ${reservation.status} - The Dreaming Tree`,
      html: wrapTemplate(content)
    });
    logger.info(`Reservation status email successfully sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send reservation confirmation to ${email}: ${error.message}`);
  }
};
