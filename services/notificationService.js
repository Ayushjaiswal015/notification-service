const emailService = require('./emailService');
const smsService = require('./smsService');
const inAppService = require('./inAppService');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Process a notification based on its type
 * @param {Object} notification - The notification object
 * @returns {Promise<Object>} - The result of the notification processing
 */
const processNotification = async (notification) => {
  try {
    logger.info(`Processing ${notification.type} notification for user ${notification.userId}`);
    
    let result;
    
    switch(notification.type) {
      case 'email':
        result = await emailService.send(notification);
        break;
      case 'sms':
        result = await smsService.send(notification);
        break;
      case 'in-app':
        result = await inAppService.send(notification);
        break;
      default:
        throw new Error(`Unsupported notification type: ${notification.type}`);
    }
    
    // Update notification status in the database
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'delivered',
      updatedAt: new Date()
    });
    
    logger.info(`Successfully delivered ${notification.type} notification to user ${notification.userId}`);
    return { success: true, ...result };
    
  } catch (error) {
    logger.error(`Failed to process ${notification.type} notification: ${error.message}`);
    
    // Update notification with failure information
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'failed',
      updatedAt: new Date(),
      metadata: {
        ...notification.metadata,
        lastError: error.message,
        failedAt: new Date()
      }
    });
    
    return { 
      success: false, 
      error: error.message,
      notification
    };
  }
};

/**
 * Create a new notification and queue it for processing
 * @param {Object} notificationData - The notification data
 * @param {String} notificationData.userId - User ID to notify
 * @param {String} notificationData.type - Type of notification (email, sms, in-app)
 * @param {String} notificationData.message - Notification message
 * @param {String} notificationData.title - Optional notification title
 * @param {String} notificationData.recipient - Email or phone number for email/sms
 * @returns {Promise<Object>} - The created notification
 */
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification({
      ...notificationData,
      status: 'pending'
    });
    
    await notification.save();
    logger.info(`Created new ${notification.type} notification for user ${notification.userId}`);
    
    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
    throw error;
  }
};

/**
 * Get notifications for a specific user
 * @param {String} userId - The user ID
 * @param {Object} options - Query options (limit, skip, status)
 * @returns {Promise<Array>} - Array of notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 10, skip = 0, status } = options;
  
  try {
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    const notifications = await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    return notifications;
  } catch (error) {
    logger.error(`Failed to get notifications for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Handle a failed notification - increment retry count or mark as permanently failed
 * @param {Object} notification - The notification object
 * @param {Error} error - The error that occurred
 * @returns {Promise<Object>} - Updated notification
 */
const handleFailedNotification = async (notification, error) => {
  try {
    const updatedNotification = await Notification.findById(notification._id);
    const retryCount = updatedNotification.retryCount + 1;
    const maxRetries = updatedNotification.maxRetries;
    
    const shouldRetry = retryCount <= maxRetries;
    
    logger.info(`Notification ${notification._id} failed. Retry ${retryCount}/${maxRetries}`);
    
    const update = {
      retryCount,
      status: shouldRetry ? 'pending' : 'failed',
      metadata: {
        ...updatedNotification.metadata,
        lastError: error.message,
        lastRetryAt: new Date()
      }
    };
    
    const result = await Notification.findByIdAndUpdate(notification._id, update, { new: true });
    return { notification: result, shouldRetry };
    
  } catch (error) {
    logger.error(`Error handling failed notification: ${error.message}`);
    throw error;
  }
};

module.exports = {
  processNotification,
  createNotification,
  getUserNotifications,
  handleFailedNotification
};