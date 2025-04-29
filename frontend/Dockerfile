FROM node:18 as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Command to run the app in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 