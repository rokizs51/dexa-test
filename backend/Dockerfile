# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache netcat-openbsd curl
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./
RUN npm ci

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose ports
# API Gateway: 3000
# Auth Service: 3001, Employee Service: 3002, Attendance Service: 3003, File Service: 3004
# Debug ports: 9229-9233
EXPOSE 3000 3001 3002 3003 3004

# Remove debug configuration - services configure their own ports
# ENV NODE_OPTIONS=--inspect=0.0.0.0:9229

CMD ["npm", "run", "start"]
