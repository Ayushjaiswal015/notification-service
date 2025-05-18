const amqp = require('amqplib');
const config = require('../config/default');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const pushService = require('../services/pushService');
const NotificationModel = require('../models/Notification');

class NotificationConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = config.rabbitmq.exchangeName;
    this.queues = {
      email: 'notification.email',
      sms: 'notification.sms',
      push: 'notification.push'
    };
    this.handlers = {
      email: this.handleEmailNotification.bind(this),
      sms: this.handleSmsNotification.bind(this),
      push: this.handlePushNotification.bind(this)
    };
  }

  async initialize() {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      this.channel.prefetch(config.rabbitmq.prefetchCount || 10);
      await this.channel.assertExchange(this.exchangeName, 'direct', { durable: true });
      await this.setupQueues();
      logger.info('Notification consumer initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize notification consumer: ${error.message}`);
      throw error;
    }
  }

  async setupQueues() {
    for (const [type, queueName] of Object.entries(this.queues)) {
      await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'notification.dlx',
          'x-dead-letter-routing-key': `${type}.failed`
        }
      });
      await this.channel.bindQueue(queueName, this.exchangeName, type);
      logger.info(`Queue setup complete: ${queueName}`);
    }
    await this.channel.assertExchange('notification.dlx', 'direct', { durable: true });
    for (const type of Object.keys(this.queues)) {
      const dlqName = `notification.${type}.failed`;
      await this.channel.assertQueue(dlqName, { durable: true });
      await this.channel.bindQueue(dlqName, 'notification.dlx', `${type}.failed`);
      logger.info(`Dead letter queue setup complete: ${dlqName}`);
    }
  }

  async consumeAll() {
    try {
      if (!this.channel) {
        await this.initialize();
      }
      for (const [type, queueName] of Object.entries(this.queues)) {
        await this.channel.consume(queueName, async (message) => {
          if (!message) return;
          let content;
          try {
            content = JSON.parse(message.content.toString());
            const handler = this.handlers[type];
            if (!handler) throw new Error(`No handler configured for notification type: ${type}`);
            await handler(content);
            this.channel.ack(message);
            logger.info(`Successfully processed ${type} notification`, { 
              notificationId: content.id || 'unknown' 
            });
          } catch (error) {
            logger.error(`Error processing ${type} notification: ${error.message}`, {
              error: error.stack
            });
            this.channel.reject(message, false);
            if (content && content.id) {
              try {
                // Use findByIdAndUpdate as a fallback if updateStatus is not implemented
                await NotificationModel.findByIdAndUpdate(
                  content.id,
                  { status: 'failed', 'metadata.lastError': error.message }
                );
              } catch (dbError) {
                logger.error(`Failed to update notification status: ${dbError.message}`);
              }
            }
          }
        });
        logger.info(`Started consuming ${type} notifications from queue: ${queueName}`);
      }
    } catch (error) {
      logger.error(`Failed to start notification consumers: ${error.message}`);
      throw error;
    }
  }

  async handleEmailNotification(notification) {
    await NotificationModel.findByIdAndUpdate(notification.id, { status: 'processing' });
    await emailService.send(notification);
    await NotificationModel.findByIdAndUpdate(notification.id, { status: 'delivered' });
  }

  async handleSmsNotification(notification) {
    await NotificationModel.findByIdAndUpdate(notification.id, { status: 'processing' });
    await smsService.send(notification);
    await NotificationModel.findByIdAndUpdate(notification.id, { status: 'delivered' });
  }

  async handlePushNotification(notification) {
    await NotificationModel.findByIdAndUpdate(notification.id, { status: 'processing' });
    await pushService.send(notification);
    await NotificationModel.findByIdAndUpdate(notification.id, { status: 'delivered' });
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('Notification consumer connection closed');
    } catch (error) {
      logger.error(`Error closing consumer connection: ${error.message}`);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }

  async reprocessFailedNotifications(type, limit = 10) {
    try {
      if (!this.channel) {
        await this.initialize();
      }
      const dlqName = `notification.${type}.failed`;
      let processedCount = 0;
      for (let i = 0; i < limit; i++) {
        const message = await this.channel.get(dlqName, { noAck: false });
        if (!message) break;
        try {
          const content = JSON.parse(message.content.toString());
          logger.info(`Reprocessing failed ${type} notification`, { 
            notificationId: content.id || 'unknown' 
          });
          await this.channel.publish(
            this.exchangeName,
            type,
            message.content,
            message.properties
          );
          this.channel.ack(message);
          processedCount++;
        } catch (error) {
          logger.error(`Failed to reprocess notification: ${error.message}`);
          this.channel.nack(message, false, false);
        }
      }
      return processedCount;
    } catch (error) {
      logger.error(`Error reprocessing failed notifications: ${error.message}`);
      throw error;
    }
  }

  // Add start/stop methods for server.js compatibility
  async start() {
    await this.consumeAll();
  }
  async stop() {
    await this.close();
  }
}

// Export singleton instance
const consumer = new NotificationConsumer();
module.exports = consumer;
