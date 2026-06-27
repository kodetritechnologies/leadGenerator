import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Sends an email using SMTP transport settings defined in environment variables.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const host = process.env.MAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const secure = process.env.MAIL_SECURITY === 'true' && port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Prevents certificate verification errors
      },
    });

    const mailOptions = {
      from: `"Team Kodetri Technologies" <${process.env.USER_MAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email in mailer utility: ${error.message}`);
    throw error;
  }
};
