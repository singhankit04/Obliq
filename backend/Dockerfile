# Use official Node.js runtime as the base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

#Install build dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose the application port
EXPOSE 5000


# Command to run the application
CMD ["npm", "run", "dev"]
