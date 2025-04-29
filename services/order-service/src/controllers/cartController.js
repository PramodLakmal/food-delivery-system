const Cart = require('../models/Cart');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    // Create an empty cart if none exists
    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id,
        items: []
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { 
      menuItemId, 
      name, 
      price, 
      quantity, 
      restaurantId, 
      restaurantName,
      imageUrl,
      notes 
    } = req.body;

    // Validate required fields
    if (!menuItemId || !name || !price || !restaurantId || !restaurantName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide menuItemId, name, price, restaurantId, and restaurantName'
      });
    }

    // Process the image URL to avoid storage issues
    let processedImageUrl = '';
    if (imageUrl) {
      // Check if it's a data URL (base64)
      if (imageUrl.startsWith('data:image')) {
        // Store a reference instead of the full data URL
        // This is just a placeholder - in a real-world app, you'd store
        // the image in a storage service and reference its URL
        processedImageUrl = `${menuItemId}_thumbnail`;
        console.log('Base64 image detected - storing as reference');
      } else {
        // Regular URL, store as is
        processedImageUrl = imageUrl;
      }
    }

    // Find user's cart or create new one
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id,
        items: []
      });
    }

    // Check if attempting to add item from different restaurant
    if (cart.items.length > 0) {
      const existingRestaurantId = cart.items[0].restaurantId.toString();
      
      if (existingRestaurantId !== restaurantId.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Cannot add items from different restaurants to the same cart',
          currentRestaurantId: existingRestaurantId
        });
      }
    }

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(item => 
      item.menuItemId.toString() === menuItemId.toString()
    );

    if (itemIndex > -1) {
      // Item exists, update quantity
      cart.items[itemIndex].quantity += quantity || 1;
      cart.items[itemIndex].notes = notes || cart.items[itemIndex].notes;
    } else {
      // Item doesn't exist, add new item
      cart.items.push({
        menuItemId,
        name,
        price,
        quantity: quantity || 1,
        restaurantId,
        restaurantName,
        imageUrl: processedImageUrl,
        notes: notes || ''
      });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const itemId = req.params.itemId;

    // Validate quantity
    if (quantity !== undefined && quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1'
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }

    // Update quantity if provided
    if (quantity !== undefined) {
      cart.items[itemIndex].quantity = quantity;
    }

    // Update notes if provided
    if (notes !== undefined) {
      cart.items[itemIndex].notes = notes;
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
exports.removeCartItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;

    // Find user's cart
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    // Remove item from cart
    cart.items = cart.items.filter(item => 
      item._id.toString() !== itemId
    );

    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error in removeCartItem:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    // Find user's cart
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    // Clear all items
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error in clearCart:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 