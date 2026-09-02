# ==========================================
# SkillBridge Frontend — Production Dockerfile
# Multi-stage React + Nginx Alpine Build
# ==========================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root & client package definitions
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci

# Copy client source code
COPY client ./client

# Compile production bundle
RUN npm run build --workspace=client

# ------------------------------------------
# Stage 2: Serve with Nginx Alpine
# ------------------------------------------
FROM nginx:1.25-alpine AS runner

# Copy customized Nginx configuration
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
