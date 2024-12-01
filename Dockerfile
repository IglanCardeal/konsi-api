FROM node:20.15.1-alpine

# Add necessary packages
RUN apk add --no-cache wget curl

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application (default command, can be overridden in docker-compose)
CMD ["npm", "run", "start:edv"]
