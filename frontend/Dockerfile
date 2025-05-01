FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set Node options to fix crypto issue
ENV NODE_OPTIONS="--experimental-global-webcrypto"

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 