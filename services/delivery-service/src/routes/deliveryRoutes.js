const express = require('express');
const { protect, isDeliveryPerson, isAdmin } = require('../middleware/auth');
const {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  updateDeliveryLocation,
  getActiveDeliveries,
  getDeliveryHistory,
  rateDelivery
} = require('../controllers/deliveryController');

const router = express.Router();

// Public health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'delivery-routes' });
});

// Routes requiring authentication
router.post('/', protect, createDelivery);
router.get('/', protect, isAdmin, getDeliveries);
router.get('/active', protect, isDeliveryPerson, getActiveDeliveries);
router.get('/history', protect, isDeliveryPerson, getDeliveryHistory);
router.get('/order/:orderId', protect, getDeliveryByOrderId);
router.get('/:id', protect, getDeliveryById);
router.put('/:id/status', protect, updateDeliveryStatus);
router.put('/:id/location', protect, isDeliveryPerson, updateDeliveryLocation);
router.post('/:id/rate', protect, rateDelivery);

module.exports = router; 