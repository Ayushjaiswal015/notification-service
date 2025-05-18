require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/default');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Request logging
app.use(morgan('dev', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

// API routes
const notificationRoutes = require('./routes/notifications');
app.use('/api', notificationRoutes);

// Basic root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Notification Service',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;