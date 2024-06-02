# Use the official Node.js 20 image as the base image
FROM node:20

# Create and set the working directory for the backend
WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Install Python, venv, and other necessary packages
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install OpenAI Python library inside the virtual environment
RUN pip install openai

# Copy backend code
COPY backend/ ./backend/

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy frontend code
COPY frontend/ ./frontend/

# Add environment variable to fix Terser build issue
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV OPENAI_API_KEY=''

# Build the frontend
RUN cd frontend && npm run build

# Expose the ports the apps run on
EXPOSE 8080 5000

# Start both frontend and backend
CMD ["sh", "-c", "npm run serve --prefix /app/frontend & node /app/backend/server.js"]
