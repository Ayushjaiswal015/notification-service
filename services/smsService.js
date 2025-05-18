const config = require('../config/default');
const logger = require('../utils/logger');

// In a real implementation, we would use Twilio here
// const twilio = require('twilio');
// const client = twilio(config.sms.accountSid, config.sms.authToken);

/**
 * Send an SMS notification
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
    
    // Simulated SMS sending for development/demo purposes
    // In production, we would use Twilio or another SMS service
    
    /*
    // Example Twilio implementation:
    const message = await client.messages.create({
      body: notification.message,
      from: config.sms.from,
      to: notification.recipient
    });
    
    return {
      messageId: message.sid,
      recipient: notification.recipient,
      sentAt: new Date()
    };
    */
    
    // Simulated response
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    return {
      messageId: `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      recipient: notification.recipient,
      sentAt: new Date()
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
    // In this simulated version, we just return true
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