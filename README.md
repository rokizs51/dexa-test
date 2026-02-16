# DEXA - WFH Attendance Application

A full-stack WFH (Work From Home) attendance management system with NestJS microservices backend and React frontend.

## Project Structure

```
dexa/
├── backend/          # NestJS microservices backend
│   ├── apps/
│   │   ├── api-gateway/       # Main API entry point (port 3000)
│   │   ├── auth-service/      # Authentication service (port 3001)
│   │   ├── employee-service/  # Employee management (port 3002)
│   │   ├── attendance-service/# Attendance tracking (port 3003)
│   │   └── file-service/      # File upload handling (port 3004)
│   └── ...
└── hr-fe/            # React + Vite frontend
```

## Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0 (or use Docker)

---

## Quick Start

### Option 1: Run with Docker (Recommended)

```bash
# Start all services including database
cd backend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Run Locally

#### 1. Start MySQL

```bash
# Using Docker for MySQL only
docker run -d \
  --name dexa-db \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=dexa_db \
  mysql:8.0

# Or use local MySQL installation
```

#### 2. Start Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run database migrations
npm run db:push

# (Optional) Seed demo data
npm run db:seed

# Start all services in development mode
npm run start:dev

# Or start individual services:
# npm run start:dev:api-gateway
# npm run start:dev:auth-service
# npm run start:dev:employee-service
# npm run start:dev:attendance-service
# npm run start:dev:file-service
```

#### 3. Start Frontend

```bash
cd hr-fe

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Access Points

| Service          | URL                        |
|------------------|----------------------------|
| Frontend         | http://localhost:5173      |
| API Gateway      | http://localhost:3000      |
| Swagger Docs     | http://localhost:3000/docs |
| Health Check     | http://localhost:3000/health|

---

## Available Scripts

### Backend

| Command                  | Description                              |
|--------------------------|------------------------------------------|
| `npm run start:dev`     | Start all services in watch mode        |
| `npm run build`          | Build all services for production       |
| `npm run db:push`        | Push schema to database                 |
| `npm run db:seed`       | Seed demo data                          |
| `npm run test`          | Run unit tests                          |
| `npm run lint`          | Lint code                               |

### Frontend

| Command         | Description                     |
|-----------------|---------------------------------|
| `npm run dev`   | Start dev server               |
| `npm run build` | Build for production           |
| `npm run lint`  | Lint code                      |

---

## Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=dexa_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
```

---

## Tech Stack

### Backend
- NestJS (Microservices architecture)
- Drizzle ORM + MySQL
- Passport (Authentication)
- Swagger (API Documentation)

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
