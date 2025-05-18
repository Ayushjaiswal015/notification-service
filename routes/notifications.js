const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');
const validate = require('../middleware/validation');
const queueProducer = require('../queue/producer');
const logger = require('../utils/logger');

/**
 * @route   POST /api/notifications
 * @desc    Send a new notification
 * @access  Public
 */
router.post('/notifications', [
  // Validate request body
  validate([
    body('userId').notEmpty().withMessage('User ID is required'),
    body('type').isIn(['email', 'sms', 'in-app']).withMessage('Invalid notification type'),
    body('message').notEmpty().withMessage('Message is required'),
    body('recipient').custom((value, { req }) => {
      // Recipient is required for email and SMS notifications
      if (['email', 'sms'].includes(req.body.type) && !value) {
        throw new Error(`Recipient is required for ${req.body.type} notifications`);
      }
      
      // Validate email format
      if (req.body.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error('Invalid email format');
        }
      }
      
      // Validate phone number format for SMS (basic check)
      if (req.body.type === 'sms' && value) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(value)) {
          throw new Error('Invalid phone number format');
        }
      }
      
      return true;
    })
  ])
], async (req, res, next) => {
  try {
    // Create the notification
    const notification = await notificationService.createNotification(req.body);
    
    // Add notification to the queue for processing
    await queueProducer.publishNotification(notification.type, notification); // <-- Fixed line
    
    logger.info(`Created and queued ${notification.type} notification for user ${notification.userId}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Notification queued for processing',
      data: {
        notificationId: notification._id,
        status: notification.status
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/:id/notifications
 * @desc    Get notifications for a specific user
 * @access  Public
 */
router.get('/users/:id/notifications', [
  // Validate URL parameters and query string
  validate([
    param('id').notEmpty().withMessage('User ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive number'),
    query('status').optional().isIn(['pending', 'sent', 'failed', 'delivered']).withMessage('Invalid status')
  ])
], async (req, res, next) => {
  try {
    const userId = req.params.id;
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      skip: req.query.skip ? parseInt(req.query.skip) : 0,
      status: req.query.status
    };
    
    const notifications = await notificationService.getUserNotifications(userId, options);
    
    logger.info(`Retrieved ${notifications.length} notifications for user ${userId}`);
    
    res.json({
      status: 'success',
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/notifications/:id
 * @desc    Get a specific notification by ID
 * @access  Public
 */
router.get('/notifications/:id', [
  validate([
    param('id').notEmpty().withMessage('Notification ID is required')
  ])
], async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    res.json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/notifications/status
 * @desc    Get service status information
 * @access  Public
 */
router.get('/notifications/status', async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        service: 'Notification Service',
        uptime: process.uptime(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
