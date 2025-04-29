const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');

// @desc    Register a user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, address, role } = req.body;

  // Validate role if provided
  const validRoles = ['customer', 'restaurant-admin', 'delivery-person', 'admin'];
  if (role && !validRoles.includes(role)) {
    return next(new ErrorResponse(`Role must be one of: ${validRoles.join(', ')}`, 400));
  }

  // Set up user data
  const userData = {
    name,
    email,
    phone,
    password,
    address,
    role: role || 'customer' // Default to customer if not specified
  };

  // If role is delivery-person, initialize deliveryInfo
  if (role === 'delivery-person') {
    userData.deliveryInfo = {
      isAvailable: false // Default to not available
    };
    
    // Add any delivery info if provided
    if (req.body.vehicleType) userData.deliveryInfo.vehicleType = req.body.vehicleType;
    if (req.body.vehicleNumber) userData.deliveryInfo.vehicleNumber = req.body.vehicleNumber;
    if (req.body.licenseNumber) userData.deliveryInfo.licenseNumber = req.body.licenseNumber;
  }

  // Create user
  const user = await User.create(userData);

  sendTokenResponse(user, 201, res);
});

// @desc    Register delivery personnel
// @route   POST /api/users/register-delivery
// @access  Public
exports.registerDeliveryPersonnel = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    email, 
    phone, 
    password, 
    address, 
    vehicleType,
    vehicleNumber,
    licenseNumber
  } = req.body;

  // Create user with delivery-person role
  const user = await User.create({
    name,
    email,
    phone,
    password,
    address,
    role: 'delivery-person',
    deliveryInfo: {
      vehicleType,
      vehicleNumber,
      licenseNumber,
      isAvailable: false // Default to not available until they set themselves online
    }
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/users/update-details
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update delivery personnel details
// @route   PUT /api/users/update-delivery-details
// @access  Private (Delivery Personnel only)
exports.updateDeliveryDetails = asyncHandler(async (req, res, next) => {
  // Get the current user
  const user = await User.findById(req.user.id);
  
  // Check if user is a delivery person
  if (user.role !== 'delivery-person') {
    return next(new ErrorResponse('Not authorized, only delivery personnel can update delivery details', 403));
  }
  
  // Extract delivery specific fields
  const { 
    vehicleType, 
    vehicleNumber, 
    licenseNumber,
    isAvailable,
    currentLocation 
  } = req.body;
  
  // Update delivery info
  const updateData = {};
  
  // Update basic user fields if provided
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.email) updateData.email = req.body.email;
  if (req.body.phone) updateData.phone = req.body.phone;
  if (req.body.address) updateData.address = req.body.address;
  
  // Build the deliveryInfo update object
  const deliveryInfoUpdates = {};
  
  if (vehicleType) deliveryInfoUpdates.vehicleType = vehicleType;
  if (vehicleNumber) deliveryInfoUpdates.vehicleNumber = vehicleNumber;
  if (licenseNumber) deliveryInfoUpdates.licenseNumber = licenseNumber;
  if (isAvailable !== undefined) deliveryInfoUpdates.isAvailable = isAvailable;
  if (currentLocation) deliveryInfoUpdates.currentLocation = currentLocation;
  
  // Only include deliveryInfo if there are updates
  if (Object.keys(deliveryInfoUpdates).length > 0) {
    updateData.deliveryInfo = deliveryInfoUpdates;
  }
  
  // Update the user
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// @desc    Update password
// @route   PUT /api/users/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get all delivery personnel
// @route   GET /api/users/delivery-personnel
// @access  Private/Admin
exports.getDeliveryPersonnel = asyncHandler(async (req, res, next) => {
  const deliveryPersonnel = await User.find({ role: 'delivery-person' });
  
  res.status(200).json({
    success: true,
    count: deliveryPersonnel.length,
    data: deliveryPersonnel
  });
});

// @desc    Get available delivery personnel
// @route   GET /api/users/delivery-personnel/available
// @access  Private (Admin & Restaurant Admin)
exports.getAvailableDeliveryPersonnel = asyncHandler(async (req, res, next) => {
  const availablePersonnel = await User.find({ 
    role: 'delivery-person',
    'deliveryInfo.isAvailable': true 
  });
  
  res.status(200).json({
    success: true,
    count: availablePersonnel.length,
    data: availablePersonnel
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Include delivery info for delivery personnel
        ...(user.role === 'delivery-person' && { deliveryInfo: user.deliveryInfo })
      }
    });
}; 