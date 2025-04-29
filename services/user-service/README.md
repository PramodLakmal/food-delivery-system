# User Service

This microservice handles user management for the food delivery system.

## Features

- User registration and authentication
- Role-based access control (Customer, Restaurant Admin, Delivery Person, Admin)
- User profile management
- Admin user management

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/food-delivery-users
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

## Running the Service

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user

### User Profile (Protected)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/update-details` - Update user details
- `PUT /api/users/update-password` - Update user password

### Admin Routes (Protected, Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Authentication

This service uses JWT (JSON Web Token) for authentication. Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
``` 