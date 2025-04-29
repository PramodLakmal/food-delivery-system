const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  createOrderAfterPayment,
  getOrders, 
  getOrder, 
  updateOrderStatus, 
  updatePaymentStatus,
  cancelOrder, 
  getRestaurantOrders,
  getOrderStats
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Routes accessible to all authenticated users
router.route('/')
  .post(createOrder)
  .get(getOrders);

router.route('/complete-payment')
  .post(createOrderAfterPayment);

router.route('/stats')
  .get(getOrderStats);

router.route('/:id')
  .get(getOrder);

router.route('/:id/cancel')
  .patch(cancelOrder);

router.route('/:id/payment')
  .patch(updatePaymentStatus);

// Routes for admin and restaurant-admin only
router.route('/:id/status')
  .patch(authorize('admin', 'restaurant-admin'), updateOrderStatus);

// Fix restaurant orders route to properly authorize restaurant-admin users
router.route('/restaurant/:restaurantId')
  .get(authorize('admin', 'restaurant-admin'), getRestaurantOrders);

module.exports = router; 