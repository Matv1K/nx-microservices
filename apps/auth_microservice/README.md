# Auth Microservice

A secure, production-ready authentication microservice built with Express, TypeScript, Prisma 7, PostgreSQL, and Redis.

## Features

- ✅ User registration
- ✅ User login with JWT tokens (access + refresh)
- ✅ Token refresh endpoint
- ⏳ Logout with token blacklisting via Redis (TODO: To be implemented)
- ✅ Protected routes with authentication middleware
- ⏳ Rate limiting for auth endpoints (TODO: To be implemented)
- ⏳ Input validation (email, password strength, username) (TODO: To be implemented)
- ⏳ CORS configuration (TODO: To be implemented)
- ⏳ Google OAuth sign-in/sign-up (TODO: To be implemented)
- ✅ CORS configuration
- ✅ Comprehensive error handling
- ✅ Structured logging with Winston (console + file)
- ✅ Automatic cleanup of expired tokens
- ✅ Redis integration for token blacklisting
- ✅ Prisma 7 compatibility with adapter pattern
- ✅ Docker support with multi-stage builds
- ✅ Request/response logging with timing
- ✅ Graceful shutdown handling

## API Endpoints

### Public Endpoints

- `GET /` - Health check endpoint
  - Returns: `{ success: true, message: "Auth microservice is running", timestamp: "..." }`

- `POST /internal/auth/register` - Register a new user
  - Body: `{ username, email, password, repeatPassword }`
  - TODO: Add rate limiting (5 requests per 15 minutes recommended)
  - TODO: Add input validation (Username: 3-30 chars, Email: valid format, Password: min 8 chars with uppercase, lowercase, number)

- `POST /internal/auth/login` - Login user
  - Body: `{ login, password }` (login can be username OR email)
  - Returns: `{ accessToken, refreshToken }`
  - TODO: Add rate limiting (5 requests per 15 minutes recommended)
  - TODO: Add input validation

- `POST /internal/auth/refresh` - Refresh access token
  - Body: `{ refreshToken }`
  - Returns: `{ accessToken }`

### Protected Endpoints (Require Authentication)

- `POST /internal/auth/logout` - Logout user (TODO: To be implemented)
  - Headers: `Authorization: Bearer <accessToken>`
  - Body: `{ refreshToken }`
  - Currently returns 501 (Not Implemented)
  - Should invalidate both tokens (blacklist access token, delete refresh token)

- `GET /internal/auth/me` - Get current user info
  - Headers: `Authorization: Bearer <accessToken>`
  - Returns: `{ userId, email }`

## Project Structure

```
auth_microservice/
├── app.ts                 # Main application entry point
├── config/               # Configuration management
│   └── index.ts          # Environment variable validation
├── controllers/          # Route handlers
│   └── AuthController.ts # All auth endpoints
├── db/                   # Database configuration
│   ├── prismaClient.ts   # Prisma client with adapter (Prisma 7)
│   └── schema.prisma     # Database schema (no URL - uses prisma.config.ts)
├── DTO/                  # Data Transfer Objects
│   ├── LogInDTO.ts       # Login request DTO
│   ├── RedisRepository.ts # Redis operations for token blacklisting
│   └── SignUpDTO.ts      # Registration request DTO
├── middleware/           # Express middleware
│   ├── auth.ts          # Authentication middleware (JWT verification + blacklist check)
│   ├── errorHandler.ts  # Global error handling
│   └── rateLimiter.ts   # Rate limiting configuration
├── services/            # Business logic
│   └── AuthService.ts   # Core authentication logic
└── utils/              # Utility functions
    ├── logger.ts       # Winston logger configuration
    ├── redisClient.ts  # Redis connection management
    └── validation.ts   # Input validation rules
```

## Prerequisites

- Node.js 20+ (LTS recommended)
- PostgreSQL 16+
- Redis 7+
- npm or yarn

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=Innogram
DB_PORT=5432
DB_PASSWORD=your_secure_password_here
DB_URL="postgresql://postgres:password@localhost:5432/Innogram?schema=public"
DATABASE_URL="postgresql://postgres:password@localhost:5432/Innogram?schema=public"

# JWT Configuration
JWT_KEY="your_jwt_secret_key_here_make_it_long_and_random"
ACCESS_TOKEN_EXPIRY=180        # 3 minutes in seconds
REFRESH_TOKEN_EXPIRY=600       # 10 minutes in seconds

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*                  # Or specific origin like http://localhost:3000

# Logging Configuration
LOG_LEVEL=info                 # debug, info, warn, error

# Google OAuth Configuration (TODO: Required for Google auth implementation)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GOOGLE_CALLBACK_URL=http://localhost:3001/internal/auth/google/callback
```

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Prisma Setup (Prisma 7)

**Important:** This project uses Prisma 7, which requires a `prisma.config.ts` file at the root.

The `prisma.config.ts` file is already configured at `backend/prisma.config.ts`.

**Generate Prisma Client:**
```bash
npx prisma generate --schema=./apps/auth_microservice/db/schema.prisma
```

**Run Migrations:**
```bash
npx prisma migrate dev --schema=./apps/auth_microservice/db/schema.prisma
```

Or push schema directly (for development):
```bash
npx prisma db push --schema=./apps/auth_microservice/db/schema.prisma
```

### 3. Start Services

**Option A: Local Development (without Docker)**

1. Start PostgreSQL and Redis locally
2. Run the backend:
   ```bash
   npm start
   ```

**Option B: Docker (Recommended)**

See [README.Docker.md](../../README.Docker.md) for detailed Docker setup.

Quick start:
```bash
npm run docker:up
```

## Security Features

1. **Password Hashing**: Uses bcrypt with 12 salt rounds ✅
2. **JWT Tokens**: Secure token-based authentication with configurable expiry ✅
3. **Rate Limiting**: ⏳ TODO: To be implemented
   - Auth endpoints: 5 requests per 15 minutes (recommended)
   - General endpoints: 100 requests per 15 minutes (recommended)
4. **Input Validation**: ⏳ TODO: To be implemented
   - Comprehensive validation for all inputs
5. **Token Blacklisting**: ⏳ TODO: To be implemented
   - Revokes tokens on logout using Redis
6. **CORS**: ⏳ TODO: To be implemented
   - Configurable cross-origin resource sharing
   - Important for web applications to allow frontend access
7. **Error Handling**: Prevents information leakage in production ✅
8. **Request Logging**: Tracks all requests with IP, method, path, and response time ✅

## TODO: Features to Implement

### 1. Rate Limiting
- **File**: `middleware/rateLimiter.ts`
- **Purpose**: Prevent brute force attacks and abuse
- **Instructions**: See comments in `middleware/rateLimiter.ts` for implementation details
- **Requirements**:
  - Implement `authRateLimiter` for login/register endpoints (5 requests per 15 minutes)
  - Implement `generalRateLimiter` for all endpoints (100 requests per 15 minutes)
  - Add proper error responses and logging
  - Uncomment rate limiting in `app.ts` and `controllers/AuthController.ts`

### 2. Input Validation
- **File**: `utils/validation.ts`
- **Purpose**: Validate and sanitize user inputs
- **Instructions**: See comments in `utils/validation.ts` for implementation details
- **Requirements**:
  - Validate username (3-30 chars, alphanumeric + underscores)
  - Validate email (valid email format)
  - Validate password (min 8 chars, uppercase, lowercase, number)
  - Validate password match for registration
  - Use `express-validator` library
  - Uncomment validation middleware in `controllers/AuthController.ts`

### 3. Logout Functionality
- **Files**: `services/AuthService.ts`, `controllers/AuthController.ts`
- **Purpose**: Allow users to securely log out
- **Instructions**: See comments in both files for implementation details
- **Requirements**:
  - Delete refresh token from database
  - Blacklist access token in Redis
  - Return appropriate success/error responses
  - Handle Redis unavailability gracefully
  - Uncomment logout code in both files

### 4. CORS Configuration
- **File**: `app.ts`
- **Purpose**: Enable cross-origin requests from web applications
- **Instructions**: See comments in `app.ts` for implementation details
- **Requirements**:
  - Install `cors` and `@types/cors`: `npm install cors @types/cors`
  - Configure CORS options (origin, credentials, etc.)
  - Add CORS middleware before other middleware
  - In production, specify exact frontend origins (not `*`)
  - Uncomment CORS code in `app.ts`

### 5. Google OAuth Authentication
- **Files**: `services/AuthService.ts`, `controllers/AuthController.ts`
- **Purpose**: Allow users to sign in/sign up using Google accounts
- **Instructions**: See comments in both files for implementation details
- **Requirements**:
  - Install `passport` and `passport-google-oauth20`
  - Set up Google OAuth credentials in Google Cloud Console
  - Configure environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - Implement Google OAuth strategy
  - Handle OAuth callback and create/login user
  - Generate JWT tokens (same as regular login)
  - Handle new user registration vs existing user login
  - Uncomment Google auth code in both files

## Logging

The service uses Winston for structured logging:

- **Console Output**: Always enabled (for Docker/terminal visibility)
- **File Output**: Enabled in development mode
- **Log Levels**: debug, info, warn, error
- **Request Logging**: All requests logged with method, path, status code, and duration

Example log output:
```
2025-12-06 21:10:15 [info]: POST /internal/auth/login
2025-12-06 21:10:15 [info]: POST /internal/auth/login 200 {"statusCode":200,"duration":"45ms","ip":"::ffff:172.18.0.1"}
```

## Token Management

- **Access Tokens**: Short-lived (default: 3 minutes), used for API requests
- **Refresh Tokens**: Longer-lived (default: 10 minutes), stored in database
- **Token Blacklisting**: ⏳ TODO: Access tokens should be blacklisted in Redis on logout (to be implemented)
- **Automatic Cleanup**: Expired refresh tokens are cleaned up hourly

## Testing

See [POSTMAN_TESTING_GUIDE.md](../../POSTMAN_TESTING_GUIDE.md) for comprehensive testing instructions.

Quick test:
```bash
# Health check
curl http://localhost:3001/

# Register
curl -X POST http://localhost:3001/internal/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test1234","repeatPassword":"Test1234"}'

# Login
curl -X POST http://localhost:3001/internal/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser","password":"Test1234"}'
```

## Docker

The service is fully Dockerized. See [README.Docker.md](../../README.Docker.md) for:
- Docker setup instructions
- Available npm scripts
- Troubleshooting guide
- Production considerations

## NPM Scripts

### Development
- `npm start` - Start the server locally
- `npm run format` - Format code with Prettier
- `npm run check-format` - Check code formatting

### Docker
- `npm run docker:up` - Start all services (with logs in terminal)
- `npm run docker:up:detached` - Start all services in background
- `npm run docker:down` - Stop all services
- `npm run docker:logs` - View all logs
- `npm run docker:logs:backend` - View backend logs only
- `npm run docker:ps` - List running containers
- `npm run docker:restart` - Restart all services
- `npm run docker:rebuild` - Rebuild and restart backend

## Troubleshooting

### Prisma 7 Issues

**Error: "The datasource property `url` is no longer supported"**
- Solution: Prisma 7 uses `prisma.config.ts` for connection URLs, not `schema.prisma`
- Ensure `prisma.config.ts` exists at the backend root

**Error: "The datasource property is required in your Prisma config file"**
- Solution: Ensure `prisma.config.ts` is present and properly configured
- Check that `DATABASE_URL` environment variable is set

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready` or `docker-compose ps`
- Check connection string in `.env` file
- Ensure database exists: `createdb Innogram` (if needed)

### Redis Connection Issues

- Verify Redis is running: `redis-cli ping` or `docker-compose ps`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`
- Redis is optional for basic functionality but required for token blacklisting

### Token Issues

- **Token expired**: Use refresh endpoint to get new access token
- **Token invalid**: Login again to get new tokens
- **Token blacklisted**: Token was revoked (logout), login again

## Architecture Decisions

1. **Prisma 7 Adapter Pattern**: Uses `@prisma/adapter-pg` for database connections (Prisma 7 requirement)
2. **Redis for Blacklisting**: Fast token revocation without database queries
3. **Separate Refresh Tokens**: Stored in database for better security and tracking
4. **Winston Logging**: Structured logging for better observability
5. **Rate Limiting**: Protects against brute force and DDoS attacks
6. **Input Validation**: Prevents invalid data from reaching business logic

## Production Considerations

1. **Environment Variables**: Use secure secrets management (not `.env` files)
2. **Database**: Use connection pooling, backups, and monitoring
3. **Redis**: Consider Redis Cluster for high availability
4. **Logging**: Use centralized logging (ELK, Datadog, etc.)
5. **Monitoring**: Add health checks, metrics, and alerting
6. **Security**: 
   - Use HTTPS in production
   - Set proper CORS origins
   - Use strong JWT keys (32+ characters)
   - Enable rate limiting
   - Regular security audits

## Contributing

When adding new features:
1. Follow the existing project structure
2. Add proper TypeScript types
3. Include input validation
4. Add error handling
5. Update this README
6. Add tests (when test suite is added)

## License

MIT
