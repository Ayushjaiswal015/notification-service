const http = require('http');
const app = require('./app');
const config = require('./config/default');
const logger = require('./utils/logger');
const consumer = require('./queue/consumer');
const { setIo } = require('./socket'); 

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: "*" }
});
setIo(io); // <-- Set io instance globally for services

// Handle user joining their notification room
io.on('connection', (socket) => {
  socket.on('join', ({ userId }) => {
    socket.join(userId);
    logger.info(`User ${userId} joined their notification room`);
  });
});

// Start the notification queue consumer
consumer.start()
  .then(() => logger.info('Notification queue consumer started'))
  .catch(err => {
    logger.error(`Failed to start queue consumer: ${err.message}`);
    // Don't exit the process, as the API can still function without the queue
  });

// Start the server (use server.listen, not app.listen)
const PORT = config.server.port;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.error(err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  console.error(err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  consumer.stop()
    .then(() => logger.info('Queue consumer stopped'))
    .catch(err => logger.error(`Error stopping queue consumer: ${err.message}`))
    .finally(() => {
      // Disconnect from MongoDB
      mongoose.connection.close()
        .then(() => logger.info('MongoDB connection closed'))
        .catch(err => logger.error(`Error closing MongoDB connection: ${err.message}`))
        .finally(() => {
          logger.info('Process terminated');
          process.exit(0);
        });
    });
});
