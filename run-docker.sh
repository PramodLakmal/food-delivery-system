#!/bin/bash

# Stop and remove existing containers
docker-compose down

# Build and start containers
docker-compose up --build -d

# Display container status
docker-compose ps

echo "Food Delivery System is now running!"
echo "API Gateway: http://localhost:5000"
echo "User Service: http://localhost:3001"
echo ""
echo "To stop the system, run: docker-compose down" 