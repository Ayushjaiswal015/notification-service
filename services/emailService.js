const nodemailer = require('nodemailer');
const config = require('../config/default');
const logger = require('../utils/logger');

// Create a reusable transporter object using SMTP transport

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  }
});

/**
 * Send an email notification
 * @param {Object} notification - The notification object
 * @returns {Promise<Object>} - Result of the email sending operation
 */
const send = async (notification) => {
  try {
    if (!notification.recipient) {
      throw new Error('Email recipient is required');
    }
    
    const mailOptions = {
      from: config.email.from,
      to: notification.recipient,
      subject: notification.title || 'New Notification',
      text: notification.message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${notification.title || 'New Notification'}</h2>
              <p>${notification.message}</p>
              <hr>
              <p style="font-size: 12px; color: #666;">
                This is an automated notification from the Notification Service.
              </p>
            </div>`
    };
    
    // Add any custom headers or metadata if needed
    if (notification.metadata && notification.metadata.emailOptions) {
      Object.assign(mailOptions, notification.metadata.emailOptions);
    }
    
    logger.info(`Sending email to ${notification.recipient}`);
    const info = await transporter.sendMail(mailOptions);
    
    return {
      messageId: info.messageId,
      recipient: notification.recipient,
      sentAt: new Date()
    };
    
  } catch (error) {
    logger.error(`Email service error: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Verify if email service is configured and working
 * @returns {Promise<boolean>} - True if service is ready
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    logger.info('Email service is ready');
    return true;
  } catch (error) {
    logger.error(`Email service verification failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  send,
  verifyConnection
};