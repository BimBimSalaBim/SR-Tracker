# Use the official Node.js 16 image as the base image
FROM node:20

# Create and set the working directory for the backend
WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend code
COPY backend/ ./backend/

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy frontend code
COPY frontend/ ./frontend/


# # Build the frontend
# RUN cd frontend && npm run build

# Expose the ports the apps run on
EXPOSE 8080 5000

# Start both frontend and backend
CMD ["sh", "-c", "npm run serve --prefix /app/frontend & node /app/backend/server.js"]
