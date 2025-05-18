const config = require('../config/default');
const logger = require('../utils/logger');
const twilio = require('twilio');
const client = twilio(config.sms.accountSid, config.sms.authToken);

/**
 * Send an SMS notification using Twilio
 * @param {Object} notification - The notification object
 * @returns {Promise<Object>} - Result of the SMS sending operation
 */
const send = async (notification) => {
  try {
    if (!notification.recipient) {
      throw new Error('SMS recipient (phone number) is required');
    }

    // Validate phone number format (basic check)
    if (!notification.recipient.match(/^\+?[1-9]\d{1,14}$/)) {
      throw new Error('Invalid phone number format');
    }

    logger.info(`Sending SMS to ${notification.recipient}`);

    // Real Twilio implementation:
    const message = await client.messages.create({
      body: notification.message,
      from: config.sms.from,
      to: notification.recipient
    });

    // Return actual Twilio response
    return {
      messageId: message.sid,
      recipient: notification.recipient,
      sentAt: new Date(),
      status: message.status,         // Twilio message status
      twilioResponse: message         // Full Twilio message object (optional)
    };

  } catch (error) {
    logger.error(`SMS service error: ${error.message}`);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Verify if SMS service is configured and working
 * @returns {Promise<boolean>} - True if service is ready
 */
const verifyConnection = async () => {
  try {
    // For Twilio, we could check account balance or another lightweight API call
    // Example: fetch account info
    await client.api.accounts(config.sms.accountSid).fetch();
    logger.info('SMS service is ready');
    return true;
  } catch (error) {
    logger.error(`SMS service verification failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  send,
  verifyConnection
};
