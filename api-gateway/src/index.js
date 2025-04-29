// Load environment variables as early as possible
const dotenv = require('dotenv');
const path = require('path');
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const setupRoutes = require('./routes');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

// Create Express application
const app = express();

// Apply middlewares
app.use(helmet()); // Security headers

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request body with larger limit
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup logger
logger(app);

// Setup API routes
setupRoutes(app);

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Microservices:');
  console.log(`- User Service: ${process.env.USER_SERVICE_URL || 'http://user-service:3001'}`);
  console.log(`- Restaurant Service: ${process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3002'}`);
  console.log(`- Order Service: ${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}`);
  console.log(`- Delivery Service: ${process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3004'}`);
}); 