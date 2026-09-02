# ==========================================
# SkillBridge Backend — Production Dockerfile
# Multi-stage Node.js 20 Alpine Build
# ==========================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root & server dependency definitions
COPY package*.json ./
COPY prisma ./prisma/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy server source code and prisma schema
COPY server ./server

# Generate Prisma Client and build TypeScript bundle
RUN npx prisma generate
RUN npm run build --workspace=server

# ------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper signal handling (PID 1)
RUN apk add --no-cache dumb-init

# Copy package definitions
COPY package*.json ./
COPY prisma ./prisma/
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled backend output from builder
COPY --from=builder /app/server/dist ./server/dist

# Non-root security user
USER node

EXPOSE 5000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/dist/server.js"]
