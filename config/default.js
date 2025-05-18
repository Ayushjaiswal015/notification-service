require('dotenv').config();

 

module.exports = {
    server: {
      port: process.env.PORT || 5000,
    },
    database: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/notificationsDB',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchangeName: process.env.RABBITMQ_EXCHANGE || 'notification_exchange',
      queues: {
        notifications: 'notifications_queue',
        deadLetter: 'notifications_dead_letter',
      },
      retryDelay: 5000, // 5 seconds between retries
    },
    email: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
      from: process.env.EMAIL_FROM || '',
    },
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || 'your_account_sid',
      authToken: process.env.TWILIO_AUTH_TOKEN || 'your_auth_token',
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
    },
    notification: {
      defaultMaxRetries: 3,
      logFailures: true,
    }
  };
  