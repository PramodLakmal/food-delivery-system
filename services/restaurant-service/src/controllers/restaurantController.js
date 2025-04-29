// restaurantController.js (UPDATED)
const Restaurant = require("../models/Restaurant");
const Menu = require("../models/Menu");

// @desc    Create a new restaurant
// @route   POST /api/restaurants
// @access  Private (restaurant-admin only)
exports.createRestaurant = async (req, res) => {
    try {
        const { name, location, cuisine, rating, imageUrl, coordinates } = req.body;

        if (!name || !location || !cuisine) {
            return res.status(400).json({ 
                success: false,
                error: "Name, location, and cuisine are required" 
            });
        }

        // Create new restaurant with owner ID from authenticated user
        const newRestaurant = new Restaurant({ 
            name, 
            location, 
            cuisine,
            rating: rating || 0,
            imageUrl: imageUrl || '', // Handle the image URL
            coordinates: coordinates || null, // Handle coordinates
            ownerId: req.user.id  // Set current authenticated user as owner
        });
        
        await newRestaurant.save();

        res.status(201).json({
            success: true,
            data: newRestaurant
        });
    } catch (error) {
        console.error('Create restaurant error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isDeleted: false });
        res.status(200).json({
            success: true,
            count: restaurants.length,
            data: restaurants
        });
    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Get restaurants owned by current user
// @route   GET /api/restaurants/my-restaurants
// @access  Private (restaurant-admin only)
exports.getMyRestaurants = async (req, res) => {
    try {
        console.log('========== GET MY RESTAURANTS ==========');
        console.log('User from request:', req.user);
        
        if (!req.user || !req.user.id) {
            console.log('User authentication failed - no user ID');
            return res.status(401).json({
                success: false,
                error: 'User authentication failed or user ID not found'
            });
        }
        
        // Check a sample restaurant for debugging
        const allRestaurants = await Restaurant.find({isDeleted: false});
        console.log(`Total restaurants in database: ${allRestaurants.length}`);
        
        if (allRestaurants.length > 0) {
            console.log('Sample restaurant for ID comparison:');
            console.log('- DB Restaurant ID:', allRestaurants[0]._id);
            console.log('- DB Owner ID:', allRestaurants[0].ownerId);
            console.log('- DB Owner type:', typeof allRestaurants[0].ownerId);
            console.log('- User ID:', req.user.id);
            console.log('- User ID type:', typeof req.user.id);
            
            // Check string comparison
            const ownerIdString = allRestaurants[0].ownerId.toString();
            const userIdString = req.user.id.toString();
            console.log('Owner ID as string:', ownerIdString);
            console.log('User ID as string:', userIdString);
            console.log('String comparison result:', ownerIdString === userIdString);
        }
        
        // Find user's restaurants - using direct query with string ID
        const userIdString = req.user.id.toString();
        console.log('Looking for restaurants with owner ID:', userIdString);
        
        // Find all restaurants first
        const allNonDeletedRestaurants = await Restaurant.find({isDeleted: false});
        
        // Then filter in memory to ensure string comparison works properly
        const restaurants = allNonDeletedRestaurants.filter(restaurant => {
            const restaurantOwnerIdString = restaurant.ownerId.toString();
            const isMatch = restaurantOwnerIdString === userIdString;
            console.log(`Restaurant ${restaurant.name}: owner=${restaurantOwnerIdString}, user=${userIdString}, match=${isMatch}`);
            return isMatch;
        });
        
        console.log(`Found ${restaurants.length} restaurants for user ${req.user.id}`);
        if (restaurants.length > 0) {
            console.log('First restaurant found:', {
                id: restaurants[0]._id,
                name: restaurants[0].name,
                ownerId: restaurants[0].ownerId
            });
        } else {
            console.log('No restaurants found for this user');
        }
        
        res.status(200).json({
            success: true,
            count: restaurants.length,
            data: restaurants
        });
    } catch (error) {
        console.error('Get my restaurants error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ 
            _id: req.params.id,
            isDeleted: false 
        });

        if (!restaurant) {
            return res.status(404).json({ 
                success: false,
                error: "Restaurant not found" 
            });
        }

        res.status(200).json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Update restaurant availability
// @route   PATCH /api/restaurants/:id/availability
// @access  Private (owner only)
exports.updateRestaurantAvailability = async (req, res) => {
    try {
        const { isOpen } = req.body;
        
        if (isOpen === undefined) {
            return res.status(400).json({ 
                success: false,
                error: "isOpen field is required" 
            });
        }

        // Restaurant already verified by middleware
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id, 
            { isOpen }, 
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedRestaurant
        });
    } catch (error) {
        console.error('Update restaurant availability error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Update restaurant details
// @route   PUT /api/restaurants/:id
// @access  Private (owner only)
exports.updateRestaurant = async (req, res) => {
    try {
        // Restaurant already verified by middleware
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedRestaurant
        });
    } catch (error) {
        console.error('Update restaurant error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Delete restaurant (soft delete)
// @route   DELETE /api/restaurants/:id
// @access  Private (owner only)
exports.deleteRestaurant = async (req, res) => {
    try {
        // Restaurant already verified by middleware
        const deletedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id, 
            { isDeleted: true }, 
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Restaurant deleted successfully",
            data: deletedRestaurant
        });
    } catch (error) {
        console.error('Delete restaurant error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Get system statistics
// @route   GET /api/restaurants/stats
// @access  Private (admin only)
exports.getSystemStats = async (req, res) => {
    try {
        const totalRestaurants = await Restaurant.countDocuments({ isDeleted: false });
        const totalMenuItems = await Menu.countDocuments({ isDeleted: false });
        const avgPrice = await Menu.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, avgPrice: { $avg: "$price" } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
            totalRestaurants,
            totalMenuItems,
            averageMenuPrice: avgPrice[0]?.avgPrice.toFixed(2) || 0
            }
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};
