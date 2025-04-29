const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// @desc    Health check for analytics routes
// @route   GET /api/analytics/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Analytics routes are working'
  });
});

module.exports = router; 