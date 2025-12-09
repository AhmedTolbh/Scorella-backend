# Scorella Backend API

This is a NestJS application providing the REST API for Scorella.

## Tech Stack

- **Framework**: NestJS (Modular Monolith)
- **Database**: PostgreSQL 16 (Relational Data)
- **Queue/Cache**: Redis 7
- **Storage**: DigitalOcean Spaces (S3 Compatible)
- **Language**: TypeScript

## Setup

1. Copy `.env.example` to `.env`.
2. Start infrastructure: `docker-compose up -d`.
3. Install Deps: `npm install`.
4. Run: `npm run start:dev`.

## API Modules

### Auth Module

- `POST /auth/apple`: Authenticates users via Apple Sign In.
- Handles User Creation and Age Bucketing.

### Video Module

- Entity: `Video` (Title, Url, User).
- `POST /videos/upload-url`: Returns a Presigned URL to upload specifically to Spaces.
  - Security: Generated securely on backend. Client uploads directly to cloud.
- `GET /videos/feed`: Returns latest videos.

## DigitalOcean Deployment

This project is ready for **App Platform**.

- **Build Command**: `npm run build`
- **Run Command**: `dist/main`
- **Environment Variables**: Must be set in App Platform dashboard.

## Database Schema

We use TypeORM with `synchronize: true` for development. In Production, we use Migrations.
