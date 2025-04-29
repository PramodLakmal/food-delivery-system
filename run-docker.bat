@echo off
echo Stopping any existing containers...
docker-compose down

echo Building and starting containers...
docker-compose up --build -d

echo Displaying container status...
docker-compose ps

echo.
echo Food Delivery System is now running!
echo API Gateway: http://localhost:5000
echo User Service: http://localhost:3001
echo.
echo To stop the system, run: docker-compose down
pause 