const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// @desc    Health check for delivery routes
// @route   GET /api/delivery/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Delivery routes are working'
  });
});

module.exports = router; 