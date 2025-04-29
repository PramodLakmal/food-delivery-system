const proxy = require('express-http-proxy');

// Load environment variables
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3004';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';

// Create proxy handlers
const proxyConfig = {
  users: proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl;
    },
    proxyErrorHandler: (err, res, next) => {
      console.error('User Service Proxy Error:', err);
      res.status(500).json({ status: 'error', message: 'User Service Proxy Error', error: err.message });
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`User Service Response Status: ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }),
  
  restaurants: proxy(RESTAURANT_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl;
    },
    limit: '50mb',
    proxyErrorHandler: (err, res, next) => {
      console.error('Restaurant Service Proxy Error:', err);
      res.status(500).json({ status: 'error', message: 'Restaurant Service Proxy Error', error: err.message });
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`Restaurant Service Response Status: ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }),
  
  menus: proxy(RESTAURANT_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl;
    },
    proxyErrorHandler: (err, res, next) => {
      console.error('Menu Service Proxy Error:', err);
      res.status(500).json({ status: 'error', message: 'Menu Service Proxy Error', error: err.message });
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`Menu Service Response Status: ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }),
  
  orders: proxy(ORDER_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      console.log(`Order Service Request: ${req.method} ${req.originalUrl}`);
      return req.originalUrl;
    },
    limit: '50mb',
    proxyErrorHandler: (err, res, next) => {
      console.error('Order Service Proxy Error:', err);
      res.status(500).json({ status: 'error', message: 'Order Service Proxy Error', error: err.message });
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`Order Service Response Status: ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }),
  
  delivery: proxy(DELIVERY_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl;
    },
    proxyErrorHandler: (err, res, next) => {
      console.error('Delivery Service Proxy Error:', err);
      res.status(500).json({ status: 'error', message: 'Delivery Service Proxy Error', error: err.message });
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`Delivery Service Response Status: ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }),
  
  payments: proxy(PAYMENT_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      console.log(`Payment Service Request: ${req.method} ${req.originalUrl}`);
      return req.originalUrl;
    },
    limit: '50mb',
    proxyErrorHandler: (err, res, next) => {
      console.error('Payment Service Proxy Error:', err);
      res.status(500).json({ status: 'error', message: 'Payment Service Proxy Error', error: err.message });
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`Payment Service Response Status: ${proxyRes.statusCode}`);
      return proxyResData;
    }
  })
};

module.exports = proxyConfig; 