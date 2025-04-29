const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    console.log('========== AUTH MIDDLEWARE ==========');
    console.log('Headers:', JSON.stringify(req.headers));

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
        console.log('Token found in authorization header:', token.substring(0, 15) + '...');
    } else {
        console.log('No Bearer token found in authorization header');
    }

    // Make sure token exists
    if (!token) {
        console.log('No token - unauthorized');
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully. Decoded user:', {
            id: decoded.id,
            role: decoded.role
        });

        // Add user info to request
        req.user = decoded;
        
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user.role || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
// Verify restaurant ownership
exports.verifyRestaurantOwner = async (req, res, next) => {
    try {
        // Get restaurant ID from params or body
        const restaurantId = req.params.id || req.params.restaurantId || req.body.restaurantId;
        
        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                error: 'Restaurant ID is required'
            });
        }

        console.log('==== RESTAURANT OWNERSHIP VERIFICATION ====');
        console.log('Restaurant ID:', restaurantId);
        console.log('User:', {
            id: req.user.id,
            role: req.user.role,
            idType: typeof req.user.id
        });

        // Check if restaurant exists and belongs to the user
        const restaurant = await Restaurant.findById(restaurantId);
        
        if (!restaurant) {
            console.log('Restaurant not found');
            return res.status(404).json({
                success: false,
                error: 'Restaurant not found'
            });
        }

        console.log('Restaurant found:', {
            id: restaurant._id,
            name: restaurant.name,
            ownerId: restaurant.ownerId,
            ownerIdType: typeof restaurant.ownerId
        });

        // Get string representations for comparison
        const ownerIdStr = restaurant.ownerId.toString();
        const userIdStr = req.user.id.toString();
        
        console.log('ID comparison:', {
            ownerIdStr,
            userIdStr,
            match: ownerIdStr === userIdStr,
            admin: req.user.role === 'admin'
        });

        // Compare restaurant owner with current user
        if (ownerIdStr !== userIdStr && req.user.role !== 'admin') {
            console.log('Not authorized - IDs do not match and not admin');
            return res.status(403).json({
                success: false,
                error: 'Not authorized to manage this restaurant'
            });
        }

        console.log('Authorization successful');
        // Add restaurant to request
        req.restaurant = restaurant;
        next();
    } catch (err) {
        console.error('Restaurant ownership verification error:', err);
        return res.status(500).json({
            success: false,
            error: 'Server error during restaurant ownership verification'
        });
    }
};
