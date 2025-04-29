const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  updateDetails,
  updateDeliveryDetails,
  updatePassword,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getDeliveryPersonnel,
  getAvailableDeliveryPersonnel
} = require('../controllers/userController');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');

// Simple test endpoint for API Gateway connectivity test
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User Service is running correctly',
    timestamp: new Date()
  });
});

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/update-details', protect, updateDetails);
router.put('/update-password', protect, updatePassword);

// Delivery personnel specific routes
router.put('/update-delivery-details', protect, authorize('delivery-person'), updateDeliveryDetails);

// Admin and Restaurant Admin routes
router.get('/delivery-personnel', protect, authorize('admin', 'restaurant-admin'), getDeliveryPersonnel);
router.get('/delivery-personnel/available', protect, authorize('admin', 'restaurant-admin'), getAvailableDeliveryPersonnel);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router; 