# Food Delivery System

This is a microservices-based Food Delivery System with an API Gateway pattern.

## Services

- **API Gateway**: Entry point for all client requests, handles routing to microservices
- **User Service**: Manages user authentication, registration, and profiles

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

## Deployment with Docker Compose

### Quick Start

#### On Windows

1. Navigate to the project root directory
2. Run the script:
   ```
   run-docker.bat
   ```

#### On macOS/Linux

1. Navigate to the project root directory
2. Make the script executable and run it:
   ```
   chmod +x run-docker.sh
   ./run-docker.sh
   ```

### Manual Deployment

1. Navigate to the project root directory
2. Build and start the containers:
   ```
   docker-compose up --build -d
   ```
3. Check if the containers are running:
   ```
   docker-compose ps
   ```

### Environment Variables

Each service has its own environment configuration:

- **API Gateway**: `api-gateway/.env.docker`
- **User Service**: `services/user-service/.env.docker`

Update these files to modify the service configuration.

## Accessing the Services

- **API Gateway**: http://localhost:5000
- **User Service**: http://localhost:3001

## Testing with Postman

1. Import the Postman collection from `updated-postman-collection.json`
2. Import the environment variables from `updated-postman-environment.json`
3. Select the "Food Delivery System" environment
4. Start testing the API endpoints

## Stopping the Services

To stop all containers:

```
docker-compose down
```

To stop and remove all data (including the MongoDB volume):

```
docker-compose down -v
```

## Troubleshooting

### Container Logs

To view the logs of a specific service:

```
docker-compose logs <service-name>
```

Example:
```
docker-compose logs api-gateway
```

### Restarting Services

To restart a specific service:

```
docker-compose restart <service-name>
```

Example:
```
docker-compose restart user-service
``` 