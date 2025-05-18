const amqp = require('amqplib');
const config = require('../config/default');
const logger = require('../utils/logger');

class NotificationProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.rabbitmq.exchangeName;
  }

  async initialize() {
    try {
      // Connect to RabbitMQ server
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Create exchange if it doesn't exist
      await this.channel.assertExchange(this.exchangeName, 'direct', { durable: true });
      
      logger.info('Notification producer initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize notification producer: ${error.message}`);
      throw error;
    }
  }

  async publishNotification(notificationType, notificationData) {
    try {
      if (!this.channel) {
        await this.initialize();
      }

      // Convert notification data to buffer
      const message = Buffer.from(JSON.stringify(notificationData));
      
      // Publish message to exchange with routing key = notification type
      const published = this.channel.publish(
        this.exchangeName,
        notificationType,
        message,
        { 
          persistent: true,
          contentType: 'application/json',
          headers: {
            timestamp: new Date().toISOString(),
            notificationType
          }
        }
      );

      if (published) {
        logger.info(`Published notification to queue: ${notificationType}`, { 
          notificationId: notificationData.id || 'unknown'
        });
        return true;
      } else {
        throw new Error('Failed to publish message to queue');
      }
    } catch (error) {
      logger.error(`Error publishing notification: ${error.message}`, {
        notificationType,
        error: error.stack
      });
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('Notification producer connection closed');
    } catch (error) {
      logger.error(`Error closing producer connection: ${error.message}`);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}

// Create singleton instance
const producer = new NotificationProducer();

module.exports = producer;