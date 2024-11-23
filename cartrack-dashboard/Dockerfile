FROM node:16-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./

# Change ownership of the /app directory to node user
RUN chown -R node:node /app

# Switch to node user
USER node

# Install dependencies
RUN npm install

# Copy application with correct ownership
COPY --chown=node:node . .

ENV NODE_ENV=development \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true

# Create cache directory with correct permissions
RUN mkdir -p /app/node_modules/.cache && \
    chmod -R 777 /app/node_modules/.cache

CMD ["npm", "start"] 