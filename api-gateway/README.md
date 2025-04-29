# API Gateway for Food Delivery System

This is a simple API Gateway that serves as a unified entry point for all microservices in the Food Delivery System.

## Features

- Route requests to appropriate microservices
- Basic error handling
- Request logging
- CORS support
- Security headers

## Services

The API Gateway routes requests to the following microservices:

1. User Service - Manages user accounts, authentication, and profiles
2. Restaurant Service - Manages restaurant information, menus, and availability
3. Order Service - Handles order creation, processing, and tracking
4. Delivery Service - Manages delivery personnel and delivery tracking

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following configuration:
   ```
   PORT=5000
   NODE_ENV=development
   USER_SERVICE_URL=http://localhost:3001
   RESTAURANT_SERVICE_URL=http://localhost:3002
   ORDER_SERVICE_URL=http://localhost:3003
   DELIVERY_SERVICE_URL=http://localhost:3004
   ```

## Usage

### Development Mode

```
npm run dev
```

### Production Mode

```
npm start
```

## API Routes

- `/api/health` - API Gateway health check
- `/api/users/...` - Routes to User Service
- `/api/restaurants/...` - Routes to Restaurant Service
- `/api/orders/...` - Routes to Order Service
- `/api/delivery/...` - Routes to Delivery Service

## Architecture

This API Gateway follows a simple architecture:

1. Client makes a request to the API Gateway
2. Gateway determines which microservice should handle the request
3. Request is proxied to the appropriate microservice
4. Response from the microservice is returned to the client

## Error Handling

The API Gateway includes a global error handler that:
- Logs all errors to the console
- Returns a standardized error response format
- Includes stack traces in development mode only 