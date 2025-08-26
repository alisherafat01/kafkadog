FROM node:24-alpine3.21 AS builder

WORKDIR /app

# Create necessary directories
RUN mkdir -p apps/notification-service libs/contracts libs/kafka

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY backend/apps/notification-service/package*.json ./apps/notification-service/
COPY backend/libs/contracts/package*.json ./libs/contracts/
COPY backend/libs/kafka/package*.json ./libs/kafka/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

FROM node:24-alpine3.21 AS runtime

WORKDIR /app

# Create necessary directories
RUN mkdir -p apps/notification-service libs/contracts libs/kafka

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY backend/apps/notification-service/package*.json ./apps/notification-service/
COPY backend/libs/contracts/package*.json ./libs/contracts/
COPY backend/libs/kafka/package*.json ./libs/kafka/

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
RUN pnpm install --prod

# Copy built application
COPY --from=builder /app/backend/apps/notification-service/dist ./dist
COPY --from=builder /app/backend/libs/contracts/dist ./node_modules/@kafkadog/contracts
COPY --from=builder /app/backend/libs/kafka/dist ./node_modules/@kafkadog/kafka

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

CMD ["node", "dist/main.js"]

