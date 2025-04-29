# Delivery Service Microservice

This is the delivery management microservice for the Food Delivery System. It handles the assignment and tracking of delivery personnel for food orders.

## Features

- Automatic assignment of delivery personnel based on proximity and availability
- Real-time delivery tracking
- Delivery status management
- Delivery person availability management
- Delivery history tracking
- Delivery statistics for delivery personnel
- Rating system for deliveries

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables by creating a `.env` file:
   ```
   PORT=5004
   MONGO_URI=mongodb://localhost:27017/food-delivery-delivery-service
   JWT_SECRET=your_jwt_secret
   API_GATEWAY_URL=http://localhost:5000
   NODE_ENV=development
   ```

3. Start the service:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Delivery Routes

- `GET /api/deliveries/health` - Health check
- `POST /api/deliveries` - Create a new delivery request
- `GET /api/deliveries` - Get all deliveries (admin only)
- `GET /api/deliveries/active` - Get active deliveries for a delivery person
- `GET /api/deliveries/history` - Get delivery history for a delivery person
- `GET /api/deliveries/order/:orderId` - Get a delivery by order ID
- `GET /api/deliveries/:id` - Get a delivery by ID
- `PUT /api/deliveries/:id/status` - Update delivery status
- `PUT /api/deliveries/:id/location` - Update delivery location
- `POST /api/deliveries/:id/rate` - Rate a delivery

### Assignment Routes

- `GET /api/assignments/health` - Health check
- `POST /api/assignments/register` - Register as a delivery person
- `GET /api/assignments/profile` - Get delivery person profile
- `PUT /api/assignments/availability` - Update delivery person availability
- `PUT /api/assignments/location` - Update delivery person location
- `GET /api/assignments/stats` - Get delivery person statistics
- `GET /api/assignments/available` - Get available delivery people (admin only)
- `POST /api/assignments/assign` - Manually assign a delivery to a delivery person (admin only)

## Models

### Delivery

The Delivery model tracks the entire delivery process from creation to completion:

- `orderId` - ID of the order being delivered
- `deliveryPersonId` - ID of the assigned delivery person
- `status` - Current status of the delivery (pending, assigned, picked_up, on_the_way, arrived, delivered, cancelled)
- `pickupLocation` - Location where the food should be picked up
- `deliveryLocation` - Location where the food should be delivered
- `currentLocation` - Current location of the delivery person
- `estimatedDeliveryTime` - Estimated time for delivery
- `actualDeliveryTime` - Actual time of delivery
- `assignedAt` - Time when delivery was assigned
- `pickedUpAt` - Time when food was picked up
- `distance` - Distance of the delivery route in kilometers
- `notes` - Additional notes for the delivery
- `restaurantId` - ID of the restaurant
- `customerId` - ID of the customer
- `createdAt` - Time when the delivery was created
- `updatedAt` - Time when the delivery was last updated

### DeliveryPerson

The DeliveryPerson model manages delivery personnel information:

- `userId` - ID of the user from the user service
- `name` - Name of the delivery person
- `isAvailable` - Availability status
- `currentLocation` - Current geographic location
- `activeDeliveries` - Number of current active deliveries
- `maxActiveDeliveries` - Maximum number of simultaneous deliveries allowed
- `vehicleType` - Type of vehicle used (bicycle, motorbike, car, van)
- `vehicleNumber` - Vehicle registration number
- `licenseNumber` - Driver's license number
- `rating` - Average rating of the delivery person
- `totalRatings` - Total number of ratings received
- `totalDeliveries` - Total number of deliveries completed
- `lastLocationUpdateTime` - Time of last location update
- `createdAt` - Time when the profile was created
- `updatedAt` - Time when the profile was last updated

## Communication with Other Services

This service communicates with other microservices through the API Gateway. It does not directly communicate with other services, following the principles of service isolation and API Gateway pattern.

## Authentication and Authorization

Authentication is handled via JWT tokens, which are verified by the auth middleware. The service expects the JWT token to be sent in the Authorization header in the format `Bearer {token}`.

The token should contain user information including:
- `id` - User ID
- `role` - User role (admin, delivery-person, etc.)
- `name` - User name

## Error Handling

The service uses a global error handler middleware that responds with appropriate HTTP status codes and error messages for all API endpoints. 