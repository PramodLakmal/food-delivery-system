const express = require("express");
const {
    createRestaurant,
    getRestaurants,
    getRestaurant,
    getMyRestaurants,
    updateRestaurant,
    deleteRestaurant,
    updateRestaurantAvailability,
    getSystemStats
} = require("../controllers/restaurantController");

const { protect, authorize, verifyRestaurantOwner } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get("/", getRestaurants);

// Debug route to test authentication
router.get('/auth-test', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication is working correctly',
    user: req.user
  });
});

// Simple test endpoint for API Gateway connectivity test
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant Service is running correctly',
    timestamp: new Date()
  });
});

// Important: Order matters for routes! 
// Put specific routes like 'my-restaurants' before parameter routes like '/:id'
// to prevent Express from treating 'my-restaurants' as an ID parameter

// Restaurant admin routes
router.post("/", protect, authorize('restaurant-admin', 'admin'), createRestaurant);
router.get("/my-restaurants", protect, authorize('restaurant-admin'), getMyRestaurants);

// Get restaurant by ID - must be after specific named routes to avoid conflicts
router.get("/:id", getRestaurant);

// Owner-only routes - require restaurant ownership verification
router.put("/:id", protect, authorize('restaurant-admin', 'admin'), verifyRestaurantOwner, updateRestaurant);
router.delete("/:id", protect, authorize('restaurant-admin', 'admin'), verifyRestaurantOwner, deleteRestaurant);
router.patch("/:id/availability", protect, authorize('restaurant-admin', 'admin'), verifyRestaurantOwner, updateRestaurantAvailability);

// Admin-only routes
router.get("/stats", protect, authorize('admin'), getSystemStats);

module.exports = router;
