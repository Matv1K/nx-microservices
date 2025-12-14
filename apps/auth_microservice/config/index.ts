import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    key: process.env.JWT_KEY || '',
    accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '180', 10), // 3 minutes
    refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '600', 10), // 10 minutes
  },
  database: {
    url: process.env.DATABASE_URL || process.env.DB_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required configuration
if (!config.jwt.key) {
  throw new Error('JWT_KEY environment variable is required');
}

if (!config.database.url) {
  throw new Error('DATABASE_URL or DB_URL environment variable is required');
}
