const logger = require('../utils/logger');
const { getIo } = require('../socket'); // <-- Use this

const send = async (notification) => {
  try {
    logger.info(`Processing in-app notification for user ${notification.userId}`);
    const io = getIo();
    if (io) {
      io.to(notification.userId).emit('notification', {
        message: notification.message,
        title: notification.title || 'Notification',
        userId: notification.userId,
        createdAt: new Date()
      });
      logger.info(`In-app notification emitted to user ${notification.userId}`);
    } else {
      logger.warn('Socket.io instance not found');
    }
    return {
      deliveredAt: new Date(),
      channel: 'in-app',
      userId: notification.userId
    };
  } catch (error) {
    logger.error(`In-app notification service error: ${error.message}`);
    throw new Error(`Failed to send in-app notification: ${error.message}`);
  }
};

const verifyConnection = async () => {
  logger.info('In-app notification service is ready');
  return true;
};

module.exports = {
  send,
  verifyConnection
};
