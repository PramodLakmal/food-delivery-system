// menuController.js (UPDATED)
const Menu = require("../models/Menu");
const Restaurant = require("../models/Restaurant");

// @desc    Create a menu item
// @route   POST /api/menu/:restaurantId
// @access  Private (restaurant-admin, admin)
exports.createMenuItem = async (req, res) => {
    try {
        const { name, price, availability, category, description, imageUrl } = req.body;
        const { restaurantId } = req.params;

        if (!name || !price) {
            return res.status(400).json({ 
                success: false,
                error: "Name and price are required" 
            });
        }

        // Restaurant ownership is already verified by middleware

        const newMenuItem = new Menu({ 
            restaurant: restaurantId, 
            name, 
            price, 
            availability: availability !== undefined ? availability : true,
            category: category || 'Other',
            description: description || '',
            imageUrl: imageUrl || ''
        });
        
        await newMenuItem.save();

        res.status(201).json({
            success: true,
            data: newMenuItem
        });
    } catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Bulk create menu items
// @route   POST /api/menu/:restaurantId/bulk
// @access  Private (restaurant-admin, admin)
exports.bulkCreateMenuItems = async (req, res) => {
    try {
        const items = req.body;
        const { restaurantId } = req.params;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: "Request body must be a non-empty array of menu items" 
            });
        }

        // Restaurant ownership is already verified by middleware

        const menuItems = items.map(item => ({ 
            ...item, 
            restaurant: restaurantId,
            availability: item.availability !== undefined ? item.availability : true,
            category: item.category || 'Other'
        }));
        
        const savedItems = await Menu.insertMany(menuItems);

        res.status(201).json({
            success: true,
            count: savedItems.length,
            data: savedItems
        });
    } catch (error) {
        console.error('Bulk create menu items error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Get all menu items for a restaurant
// @route   GET /api/menu/:restaurantId
// @access  Public
exports.getMenuItems = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { page = 1, limit = 10, search = "", minPrice, maxPrice, category } = req.query;

        // Verify restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ 
                success: false,
                error: "Restaurant not found" 
            });
        }

        // Build query
        let query = { 
            restaurant: restaurantId, 
            isDeleted: false 
        };

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Execute query with pagination
        const menuItems = await Menu.find(query)
            .populate("restaurant", "name location isOpen")
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .exec();

        const totalItems = await Menu.countDocuments(query);

        res.status(200).json({
            success: true,
            totalItems,
            currentPage: Number(page),
            totalPages: Math.ceil(totalItems / Number(limit)),
            data: menuItems
        });
    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Get a single menu item by ID
// @route   GET /api/menu/:restaurantId/:menuItemId
// @access  Public
exports.getMenuItem = async (req, res) => {
    try {
        const { restaurantId, menuItemId } = req.params;
        
        // Find menu item by ID and ensure it belongs to the specified restaurant
        const menuItem = await Menu.findOne({
            _id: menuItemId,
            restaurant: restaurantId,
            isDeleted: false
        }).populate("restaurant", "name location isOpen");
        
        if (!menuItem) {
            return res.status(404).json({ 
                success: false,
                error: "Menu item not found" 
            });
        }

        res.status(200).json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Get menu item error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:restaurantId/:menuItemId
// @access  Private (restaurant-admin, admin)
exports.updateMenuItem = async (req, res) => {
    try {
        const { restaurantId, menuItemId } = req.params;

        // Verify menu item exists and belongs to the restaurant
        const menuItem = await Menu.findOne({
            _id: menuItemId,
            restaurant: restaurantId,
            isDeleted: false
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                error: "Menu item not found"
            });
        }

        // Update with the request body
        const updatedMenuItem = await Menu.findByIdAndUpdate(
            menuItemId,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedMenuItem
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Delete a menu item (soft delete)
// @route   DELETE /api/menu/:id
// @access  Private (restaurant-admin, admin)
exports.deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({ 
                success: false,
                error: "Menu item not found" 
            });
        }

        // Check if user owns the restaurant this menu item belongs to
        const restaurant = await Restaurant.findById(menuItem.restaurant);
        
        if (!restaurant) {
            return res.status(404).json({ 
                success: false,
                error: "Associated restaurant not found" 
            });
        }

        if (restaurant.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                error: "Not authorized to delete this menu item" 
            });
        }

        const deletedItem = await Menu.findByIdAndUpdate(
            req.params.id, 
            { isDeleted: true }, 
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully",
            data: deletedItem
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// @desc    Update menu item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private (restaurant-admin, admin)
exports.updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body;
        
        if (availability === undefined) {
            return res.status(400).json({ 
                success: false,
                error: "Availability field is required" 
            });
        }

        const menuItem = await Menu.findById(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({ 
                success: false,
                error: "Menu item not found" 
            });
        }

        // Check if user owns the restaurant this menu item belongs to
        const restaurant = await Restaurant.findById(menuItem.restaurant);
        
        if (!restaurant) {
            return res.status(404).json({ 
                success: false,
                error: "Associated restaurant not found" 
            });
        }

        if (restaurant.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                error: "Not authorized to update this menu item" 
            });
        }

        const updatedItem = await Menu.findByIdAndUpdate(
            req.params.id, 
            { availability }, 
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        console.error('Update menu item availability error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};
