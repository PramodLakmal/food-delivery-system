FROM node:16-alpine

WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"] 