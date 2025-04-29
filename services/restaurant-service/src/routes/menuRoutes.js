const express = require("express");
const {
    createMenuItem,
    getMenuItems,
    getMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateAvailability,
    bulkCreateMenuItems
} = require("../controllers/menuController");
const { validateMenu } = require("../middlewares/validateMiddleware");
const { protect, authorize, verifyRestaurantOwner } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get("/:restaurantId", getMenuItems);
router.get("/:restaurantId/:menuItemId", getMenuItem);

// Protected routes - require authentication
router.use(protect);

// Restaurant owner only routes
router.post("/:restaurantId", authorize('restaurant-admin', 'admin'), verifyRestaurantOwner, validateMenu, createMenuItem);
router.post("/:restaurantId/bulk", authorize('restaurant-admin', 'admin'), verifyRestaurantOwner, bulkCreateMenuItems);
router.put("/:id", authorize('restaurant-admin', 'admin'), validateMenu, updateMenuItem);
router.delete("/:id", authorize('restaurant-admin', 'admin'), deleteMenuItem);
router.patch("/:id/availability", authorize('restaurant-admin', 'admin'), updateAvailability);

module.exports = router;
