import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { getRedisClient } from '../utils/redisClient';
import { RedisAuthRepository } from '../DTO/RedisRepository';

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
  }

  // Check if token is blacklisted
  try {
    const redisClient = await getRedisClient();
    const redisRepo = new RedisAuthRepository(redisClient);
    const isBlacklisted = await redisRepo.isTokenBlacklisted(token);
    
    if (isBlacklisted) {
      logger.warn('Blacklisted token attempt');
      
      return res.status(403).json({
        success: false,
        message: 'Token has been revoked',
      });
    }
  } catch (redisErr) {
    // If Redis is unavailable, log but continue (graceful degradation)
    logger.warn('Redis unavailable for token blacklist check:', redisErr);
  }

  const jwtKey = process.env.JWT_KEY;
  if (!jwtKey) {
    logger.error('JWT_KEY is not configured');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtKey) as {
      userId: number;
      sub: string;
    };

    req.userId = decoded.userId;
    req.userEmail = decoded.sub;

    return next();
  } catch (err) {
    logger.warn('Invalid token:', err);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
