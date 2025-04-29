const express = require('express');
const { protect, isDeliveryPerson, isAdmin, isRestaurantAdmin, isAdminOrRestaurantAdmin } = require('../middleware/auth');
const {
  registerDeliveryPerson,
  getDeliveryPersonProfile,
  updateAvailability,
  updateLocation,
  getDeliveryPersonStats,
  getAvailableDeliveryPeople,
  assignDelivery
} = require('../controllers/deliveryPersonController');

const router = express.Router();

// Public health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'assignment-routes' });
});

// Routes requiring authentication
router.post('/register', protect, isDeliveryPerson, registerDeliveryPerson);
router.get('/profile', protect, isDeliveryPerson, getDeliveryPersonProfile);
router.put('/availability', protect, isDeliveryPerson, updateAvailability);
router.put('/location', protect, isDeliveryPerson, updateLocation);
router.get('/stats', protect, isDeliveryPerson, getDeliveryPersonStats);
router.get('/available', protect, isAdminOrRestaurantAdmin, getAvailableDeliveryPeople);
router.post('/assign', protect, isAdminOrRestaurantAdmin, assignDelivery);

module.exports = router;