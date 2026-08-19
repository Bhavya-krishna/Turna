# Multi-Stage Production Dockerfile for Turna Frontend (Non-root / OpenShift Compatible)

# Stage 1: Build static React SPA
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with unprivileged Nginx (compatible with OpenShift arbitrary UID / SCC restricted)
FROM nginxinc/nginx-unprivileged:alpine

# Default backend host (overridden in OpenShift or docker-compose)
ENV BACKEND_HOST=backend:8000

# Copy built SPA artifacts
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx template for automated envsubst of BACKEND_HOST on startup
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Fallback default configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
