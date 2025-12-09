# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# 2. Production Stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built app
COPY --from=builder /app/dist ./dist

# Expose Port
EXPOSE 3000

# Start
CMD ["npm", "run", "start:prod"]
