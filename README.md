
# Notification Service

A robust notification microservice built with Node.js, Express, MongoDB, RabbitMQ, Socket.io, and Twilio.
Supports Email, SMS, and real-time In-App notifications.



## Features

- Email notifications (via SMTP, e.g., Gmail)

- SMS notifications (via Twilio)

- In-app notifications (real-time via Socket.io)

- Queue-based delivery using RabbitMQ

- MongoDB for notification storage and status tracking

- REST API for sending and fetching notifications

- Robust logging with Winston

- Validation and error handling middleware


## Setup Instructions

1. Clone the Repository

```bash
  git clone <your-repo-url>
  cd notification-service
```
2. Install Dependencies

```bash
    npm install
```
3. Setup Environment Variables
Create a .env file in the project root:
```text
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/notificationsDB

# RabbitMQ
RABBITMQ_URL=amqp://localhost
RABBITMQ_EXCHANGE=notification_exchange

# Email (Gmail SMTP example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Log level
LOG_LEVEL=info
```
Note:

For Gmail, use an [App Password](https://myaccount.google.com/apppasswords) (not your main password).

For Twilio trial, only verified numbers can receive SMS.

4. Start Required Services
- MongoDB: Make sure MongoDB is running locally or update MONGO_URI.

- RabbitMQ: Start RabbitMQ locally or update RABBITMQ_URL.

5. Start the Server
```bash
node server.js
```
You should see logs indicating successful connections to MongoDB, RabbitMQ, and queue setup.


    
## API Usage

#### Send a Notification
POST /api/notifications

```json
  // Email
{
  "userId": "user123",
  "type": "email",
  "message": "Hello from notification service!",
  "recipient": "someone@example.com",
  "title": "Test Email"
}

// SMS
{
  "userId": "user123",
  "type": "sms",
  "message": "This is a test SMS.",
  "recipient": "+911234567890"
}

// In-App
{
  "userId": "user123",
  "type": "in-app",
  "message": "Welcome to the app!",
  "title": "Greetings"
}

```
### Get All Notifications for a User
GET /api/users/:userId/notifications

Optional query params: limit, skip, status

### Get a Specific Notification
GET /api/notifications/:notificationId

### Get Service Status
GET /api/notifications/status

###

### Real-Time In-App Notifications
- Open test-client.html in your browser.

- Make sure the userId in the HTML matches the userId in your POST request.

- When a new in-app notification is sent, you’ll see a popup and message in the browser.

## Project Structure

```text
.
├── app.js
├── server.js
├── config/
│   └── default.js
├── middleware/
├── models/
│   └── Notification.js
├── queue/
│   ├── consumer.js
│   └── producer.js
├── routes/
│   └── notifications.js
├── services/
│   ├── emailService.js
│   ├── inAppService.js
│   ├── notificationService.js
│   ├── pushService.js
│   └── smsService.js
├── utils/
│   └── logger.js
├── socket.js
├── test-client.html
└── .env
```

## Assumptions & Notes
- RabbitMQ, MongoDB, and Node.js must be running.

- Twilio credentials are required for SMS (trial account can only send to verified numbers).

- Gmail App Password is required for email sending via Gmail SMTP.

- In-app notifications are real-time only if a Socket.io client is connected and listening.

- All sensitive credentials are stored in .env (never commit this file to git).

- Logging is handled via Winston and logs are stored in the logs/ directory.

- Dead-letter queues are set up for failed notifications.

## Trobleshooting
- ### Email not sending?

  - Check SMTP credentials and App Password.

  - Check for port blocks (587 for Gmail).

- ### SMS not sending?

  - Check Twilio credentials and number verification.

- ### In-app not working?

  - Make sure test-client.html is open and userId matches.

  - Check browser console for Socket.io connection errors.

- ### MongoDB/RabbitMQ not connecting?

  - Ensure both are running and URIs are correct.

  


## Working Screenshot

### Terminal

![Terminal](https://github.com/Ayushjaiswal015/notification-service/blob/master/terminal.jpg?raw=true)

Happy notifying! 🚀





