const jwt = require('jsonwebtoken');

// Protect routes - verify JWT token
const protect = (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user info to request
      req.user = decoded;
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Check if user has delivery-person role
const isDeliveryPerson = (req, res, next) => {
  if (req.user && req.user.role === 'delivery-person') {
    return next();
  }
  res.status(403).json({ message: 'Unauthorized, only delivery personnel can access this resource' });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Unauthorized, only admins can access this resource' });
};

// Add middleware to check if user is a restaurant admin
const isRestaurantAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'restaurant-admin') {
    return next();
  }
  res.status(403).json({ message: 'Unauthorized, only restaurant admins can access this resource' });
};

// Check if user is admin or restaurant admin
const isAdminOrRestaurantAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'restaurant-admin')) {
    return next();
  }
  res.status(403).json({ message: 'Unauthorized, only admins and restaurant admins can access this resource' });
};

module.exports = { protect, isDeliveryPerson, isAdmin, isRestaurantAdmin, isAdminOrRestaurantAdmin }; 