import bcrypt from 'bcrypt';
import * as env from 'dotenv';
import jwt from 'jsonwebtoken';
import { SignUpDto } from '../DTO/SignUpDTO';
import { LogInDTO } from '../DTO/LogInDTO';
import prisma from '../db/prismaClient';
import logger from '../utils/logger';

env.config();

const JWT_KEY = process.env.JWT_KEY;
if (!JWT_KEY) {
  throw new Error('JWT_KEY environment variable is not set');
}

const ACCESS_TOKEN_EXPIRY = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '180', 10); // 3 minutes default
const REFRESH_TOKEN_EXPIRY = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '600', 10); // 10 minutes default

export const registerUser = async (signUpDto: SignUpDto) => {
  try {
    // Validate password match
    if (signUpDto.password !== signUpDto.repeatPassword) {
      logger.warn('Registration failed: passwords do not match');
      return {
        success: false,
        status: 400,
        message: 'Passwords do not match',
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const encryptedPassword = await bcrypt.hash(signUpDto.password, 12);

      // Check if user already exists
      const existingUser = await tx.user.findFirst({
        where: {
          OR: [{ email: signUpDto.email }, { username: signUpDto.username }],
        },
      });

      if (existingUser) {
        logger.warn(`Registration failed: user already exists - ${signUpDto.email}`);
        return {
          success: false,
          status: 409,
          message: 'User with this email or username already exists',
        };
      }

      // Create new user
      await tx.user.create({
        data: {
          username: signUpDto.username,
          password: encryptedPassword,
          email: signUpDto.email,
        },
      });

      logger.info(`New user registered: ${signUpDto.email}`);
      return {
        success: true,
        status: 201,
        message: 'User registered successfully',
      };
    });

    return result;
  } catch (err) {
    logger.error('Registration error:', err);
    return {
      success: false,
      status: 500,
      message: 'Registration failed. Please try again later.',
    };
  }
};

export const logInUser = async (logInDto: LogInDTO) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: logInDto.login }, { email: logInDto.login }],
      },
    });

    if (!user) {
      logger.warn(`Login failed: user not found - ${logInDto.login}`);
      return {
        success: false,
        status: 401,
        message: 'Invalid credentials',
      };
    }

    const arePasswordsMatching = await bcrypt.compare(
      logInDto.password,
      user.password
    );

    if (!arePasswordsMatching) {
      logger.warn(`Login failed: invalid password for user - ${user.email}`);
      return {
        success: false,
        status: 401,
        message: 'Invalid credentials',
      };
    }

    const tokenPayload = {
      userId: user.id,
      sub: user.email,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_KEY, {
      issuer: 'innogram-auth-service',
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(tokenPayload, JWT_KEY, {
      issuer: 'innogram-auth-service',
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + REFRESH_TOKEN_EXPIRY);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    logger.info(`User logged in successfully: ${user.email}`);

    return {
      success: true,
      status: 200,
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  } catch (err) {
    logger.error('Login error:', err);
    return {
      success: false,
      status: 500,
      message: 'Login failed. Please try again later.',
    };
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_KEY) as {
      userId: number;
      sub: string;
    };

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      logger.warn('Refresh token not found in database');
      return {
        success: false,
        status: 401,
        message: 'Invalid refresh token',
      };
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      // Clean up expired token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      logger.warn('Refresh token expired');
      return {
        success: false,
        status: 401,
        message: 'Refresh token expired',
      };
    }

    // Generate new access token
    const tokenPayload = {
      userId: decoded.userId,
      sub: decoded.sub,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_KEY, {
      issuer: 'innogram-auth-service',
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    logger.info(`Access token refreshed for user: ${decoded.sub}`);

    return {
      success: true,
      status: 200,
      message: 'Token refreshed successfully',
      accessToken,
    };
  } catch (err) {
    logger.error('Token refresh error:', err);
    return {
      success: false,
      status: 401,
      message: 'Invalid or expired refresh token',
    };
  }
};

// TODO: Implement logout functionality
// This function should:
// 1. Delete the refresh token from the database
// 2. Blacklist the access token in Redis (if provided)
// 3. Return success response
// 
// Example implementation:
// export const logoutUser = async (refreshToken: string, accessToken?: string) => {
//   try {
//     // Delete refresh token from database
//     await prisma.refreshToken.deleteMany({
//       where: { token: refreshToken },
//     });
//
//     // Blacklist access token in Redis if provided
//     if (accessToken) {
//       try {
//         const redisClient = await getRedisClient();
//         const redisRepo = new RedisAuthRepository(redisClient);
//         await redisRepo.blacklistToken(accessToken, ACCESS_TOKEN_EXPIRY);
//       } catch (redisErr) {
//         logger.warn('Redis not available, skipping token blacklist:', redisErr);
//       }
//     }
//
//     logger.info('User logged out successfully');
//     return {
//       success: true,
//       status: 200,
//       message: 'Logout successful',
//     };
//   } catch (err) {
//     logger.error('Logout error:', err);
//     return {
//       success: false,
//       status: 500,
//       message: 'Logout failed. Please try again later.',
//     };
//   }
// };

// TODO: Implement Google OAuth authentication
// This function should handle Google OAuth callback and create/login user
//
// export const handleGoogleAuth = async (googleProfile: {
//   id: string;
//   email: string;
//   name?: string;
//   picture?: string;
// }) => {
//   try {
//     // Check if user exists by email
//     let user = await prisma.user.findUnique({
//       where: { email: googleProfile.email },
//     });
//
//     // If user doesn't exist, create new user
//     if (!user) {
//       // Generate a random password (user won't use it, but required by schema)
//       const randomPassword = await bcrypt.hash(Math.random().toString(), 12);
//       user = await prisma.user.create({
//         data: {
//           email: googleProfile.email,
//           username: googleProfile.email.split('@')[0] + '_' + googleProfile.id.slice(0, 6),
//           password: randomPassword, // User won't use password auth
//         },
//       });
//       logger.info(`New user registered via Google: ${googleProfile.email}`);
//     }
//
//     // Generate JWT tokens (same as regular login)
//     const tokenPayload = {
//       userId: user.id,
//       sub: user.email,
//     };
//
//     const accessToken = jwt.sign(tokenPayload, JWT_KEY, {
//       issuer: 'innogram-auth-service',
//       expiresIn: ACCESS_TOKEN_EXPIRY,
//     });
//
//     const refreshToken = jwt.sign(tokenPayload, JWT_KEY, {
//       issuer: 'innogram-auth-service',
//       expiresIn: REFRESH_TOKEN_EXPIRY,
//     });
//
//     const expiresAt = new Date();
//     expiresAt.setSeconds(expiresAt.getSeconds() + REFRESH_TOKEN_EXPIRY);
//
//     await prisma.refreshToken.create({
//       data: {
//         token: refreshToken,
//         userId: user.id,
//         expiresAt,
//       },
//     });
//
//     return {
//       success: true,
//       status: 200,
//       message: 'Google authentication successful',
//       accessToken,
//       refreshToken,
//       user: {
//         id: user.id,
//         email: user.email,
//         username: user.username,
//       },
//     };
//   } catch (err) {
//     logger.error('Google auth error:', err);
//     return {
//       success: false,
//       status: 500,
//       message: 'Google authentication failed',
//     };
//   }
// };

// Cleanup expired refresh tokens (should be run periodically)
export const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired refresh tokens`);
    return result.count;
  } catch (err) {
    logger.error('Token cleanup error:', err);
    throw err;
  }
};
