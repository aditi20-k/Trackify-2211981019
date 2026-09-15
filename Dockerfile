# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci

# Copy frontend source code and build production assets
COPY client/ ./
# Optional: Set VITE_API_URL during build if using a different API URL in production
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ==========================================
# Stage 2: Production Server Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Install production server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy built client static dist into client/dist (Express serves this in production)
COPY --from=client-builder /app/client/dist ./client/dist

# Expose backend port
EXPOSE 5000

# Container healthcheck using backend /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start server
WORKDIR /app/server
CMD ["node", "server.js"]
