// Mark order as ready for pickup
const markOrderAsReady = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify that this restaurant owns this order
    if (order.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Check current status
    if (order.status !== 'confirmed' && order.status !== 'preparing') {
      return res.status(400).json({ 
        message: `Cannot mark order as ready. Current status: ${order.status}`
      });
    }

    // Get restaurant details for pickup location
    const restaurantResponse = await fetch(`${process.env.API_GATEWAY_URL}/api/restaurants/${restaurantId}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    if (!restaurantResponse.ok) {
      return res.status(500).json({ message: 'Failed to fetch restaurant details' });
    }
    const restaurant = await restaurantResponse.json();

    // Update status
    order.status = 'ready';
    order.statusHistory.push({
      status: 'ready',
      timestamp: new Date()
    });
    
    await order.save();

    // Create a delivery record
    // Make sure we have all location data properly structured with coordinates
    const pickupLocation = {
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      postalCode: restaurant.postalCode
    };

    // Ensure coordinates are properly extracted and formatted
    if (restaurant.location) {
      if (restaurant.location.coordinates && Array.isArray(restaurant.location.coordinates)) {
        // MongoDB GeoJSON format [longitude, latitude]
        pickupLocation.coordinates = {
          lng: restaurant.location.coordinates[0],
          lat: restaurant.location.coordinates[1]
        };
      } else if (restaurant.location.lat !== undefined && restaurant.location.lng !== undefined) {
        // Direct lat/lng format
        pickupLocation.coordinates = {
          lat: restaurant.location.lat,
          lng: restaurant.location.lng
        };
      } else if (restaurant.location.latitude !== undefined && restaurant.location.longitude !== undefined) {
        // Alternative naming
        pickupLocation.coordinates = {
          lat: restaurant.location.latitude,
          lng: restaurant.location.longitude
        };
      }
    }

    // Format the address as a single string for the deliveryLocation
    const formattedAddress = `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`.replace(/,\s+,/g, ',').trim();
    
    // Log the entire order deliveryAddress for debugging
    console.log('Order delivery address:', JSON.stringify(order.deliveryAddress));
    
    const deliveryLocation = {
      address: formattedAddress,
      city: order.deliveryAddress.city,
      state: order.deliveryAddress.state,
      postalCode: order.deliveryAddress.zipCode
    };

    // IMPORTANT: Directly extract coordinates from order to ensure they transfer correctly
    if (order.deliveryAddress && order.deliveryAddress.coordinates) {
      // Deep copy and directly set the coordinates to make sure they are transferred
      deliveryLocation.coordinates = {
        lat: Number(order.deliveryAddress.coordinates.lat),
        lng: Number(order.deliveryAddress.coordinates.lng)
      };
      
      console.log('Extracted coordinates from order:', 
                 `lat=${order.deliveryAddress.coordinates.lat}, lng=${order.deliveryAddress.coordinates.lng}`);
    } else {
      console.warn('No coordinates found in order.deliveryAddress.coordinates!');
      
      // Fallback: check if coordinates are at the root level of deliveryAddress
      if (order.deliveryAddress.lat !== undefined && order.deliveryAddress.lng !== undefined) {
        deliveryLocation.coordinates = {
          lat: Number(order.deliveryAddress.lat),
          lng: Number(order.deliveryAddress.lng)
        };
        console.log('Found coordinates at root level of deliveryAddress:', 
                   `lat=${order.deliveryAddress.lat}, lng=${order.deliveryAddress.lng}`);
      } else {
        console.error('No coordinates available in the order deliveryAddress!');
      }
    }

    // Log the finalized deliveryLocation being sent to the delivery service
    console.log('Final deliveryLocation object being sent:', JSON.stringify(deliveryLocation));

    const deliveryData = {
      orderId: order._id,
      restaurantId: restaurantId,
      customerId: order.userId,
      pickupLocation: pickupLocation,
      deliveryLocation: deliveryLocation,
      notes: order.specialInstructions || ''
    };

    const deliveryResponse = await fetch(`${process.env.API_GATEWAY_URL}/api/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(deliveryData)
    });

    if (!deliveryResponse.ok) {
      console.error('Failed to create delivery record:', await deliveryResponse.text());
      // We don't want to fail the order status update if delivery creation fails
      // Just log the error and continue
    }

    res.status(200).json({ 
      message: 'Order marked as ready for pickup',
      order 
    });
  } catch (error) {
    console.error('Error marking order as ready:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 