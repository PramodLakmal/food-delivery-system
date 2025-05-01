const express = require('express');
const fetch = require('node-fetch');
const proxyConfig = require('../config/proxy-config');

const router = express.Router();

// Get service URLs from environment variables
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || 'http://localhost:3004';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004';

// Health check route
router.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.status(200).json({
    status: 'success',
    message: 'API Gateway is up and running',
    timestamp: new Date()
  });
});

// Debug route to check environment variables
router.get('/debug', (req, res) => {
  console.log('Debug endpoint called');
  res.status(200).json({
    status: 'success',
    environment: process.env.NODE_ENV || 'development',
    services: {
      user: USER_SERVICE_URL,
      restaurant: RESTAURANT_SERVICE_URL,
      order: ORDER_SERVICE_URL,
      delivery: DELIVERY_SERVICE_URL,
      payment: PAYMENT_SERVICE_URL
    }
  });
});

// Test route to verify proxy functionality
router.get('/test-proxy', (req, res) => {
  console.log('Test proxy endpoint called');
  fetch(`${USER_SERVICE_URL}/api/users/test`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    res.status(200).json({
      status: 'success',
      message: 'Direct API call successful',
      serviceResponse: data
    });
  })
  .catch(error => {
    console.error('Error in test-proxy endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to User Service directly',
      error: error.message
    });
  });
});

// Test restaurant proxy route
router.get('/test-restaurant-proxy', (req, res) => {
  console.log('Test restaurant proxy endpoint called');
  fetch(`${RESTAURANT_SERVICE_URL}/api/restaurants/test`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    res.status(200).json({
      status: 'success',
      message: 'Direct restaurant API call successful',
      serviceResponse: data
    });
  })
  .catch(error => {
    console.error('Error in test-restaurant-proxy endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Restaurant Service directly',
      error: error.message
    });
  });
});

// Test register endpoint
router.post('/test-register', (req, res) => {
  console.log('Test register endpoint called');
  console.log('Request body:', req.body);
  
  fetch(`${USER_SERVICE_URL}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Response from User Service:', data);
    res.status(201).json({
      status: 'success',
      message: 'Direct register API call successful',
      serviceResponse: data
    });
  })
  .catch(error => {
    console.error('Error in test-register endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user directly with User Service',
      error: error.message
    });
  });
});

// Direct auth routes that bypass the proxy middleware
// User Registration Route
router.post('/users/register', async (req, res) => {
  try {
    console.log('Direct register route called');
    console.log('Request body:', req.body);
    
    const response = await fetch(`${USER_SERVICE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    console.log('User Service register response:', data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error in direct register route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error.message
    });
  }
});

// User Login Route
router.post('/users/login', async (req, res) => {
  try {
    console.log('Direct login route called');
    console.log('Request body:', req.body);
    
    const response = await fetch(`${USER_SERVICE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    console.log('User Service login response:', data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error in direct login route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login user',
      message: error.message
    });
  }
});

// Set up proxy routes for each microservice
const setupRoutes = (app) => {
  console.log('Setting up routes for API Gateway');

  // Health check and other direct gateway routes
  app.use('/api', router);
  
  // User service routes - except for auth which are handled directly
  console.log('Setting up User Service routes at /api/users');
  app.use('/api/users', (req, res, next) => {
    // Skip proxy for register and login routes - they're handled directly
    if (req.path === '/register' || req.path === '/login') {
      return next('route');
    }
    next();
  }, proxyConfig.users);

  // Restaurant service routes
  console.log('Setting up Restaurant Service routes at /api/restaurants');
  app.use('/api/restaurants', proxyConfig.restaurants);

  // Menu service routes
  console.log('Setting up Menu Service routes at /api/menu');
  app.use('/api/menu', proxyConfig.menus);

  // Order service routes
  app.use('/api/orders', proxyConfig.orders);

  // Cart routes - forwarded to the order service
  console.log('Setting up Cart Service routes at /api/cart');
  app.use('/api/cart', proxyConfig.orders);

  // Payment service routes
  console.log('Setting up Payment Service routes at /api/payments');
  app.use('/api/payments', proxyConfig.payments);

  // Delivery service routes
  console.log('Setting up Delivery Service routes');
  app.use('/api/deliveries', proxyConfig.delivery);
  app.use('/api/assignments', proxyConfig.delivery);
  
  // Handle 404 routes - keep this as the last route
  app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
      path: req.originalUrl
    });
  });
};

module.exports = setupRoutes; 