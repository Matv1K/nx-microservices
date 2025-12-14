import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
// TODO: Implement CORS
// import cors from 'cors';
import AuthController from './controllers/AuthController';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandler';
// TODO: Implement rate limiting
// import { generalRateLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';
import { cleanupExpiredTokens } from './services/AuthService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// TODO: Implement CORS configuration
// CORS (Cross-Origin Resource Sharing) is important for web applications
// Instructions:
// 1. Install cors: npm install cors @types/cors
// 2. Configure CORS options based on your frontend origin
// 3. Add CORS middleware before other middleware
//
// Example implementation:
// const corsOptions = {
//   origin: process.env.CORS_ORIGIN || '*', // In production, specify exact origins
//   credentials: true,
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TODO: Implement rate limiting
// Rate limiting should be added here to prevent abuse
// Uncomment the line below and implement rate limiting middleware
// app.use(generalRateLimiter);

// Request logging with response status
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
    logger[statusColor](`${req.method} ${req.path} ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
});

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Auth microservice is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use(AuthController);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Auth microservice is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Cleanup expired tokens every hour
setInterval(async () => {
  try {
    await cleanupExpiredTokens();
  } catch (err) {
    logger.error('Error cleaning up expired tokens:', err);
  }
}, 60 * 60 * 1000); // 1 hour

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
