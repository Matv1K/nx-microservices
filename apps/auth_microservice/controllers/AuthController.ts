import express, { Request, Response } from 'express';
import {
  registerUser,
  logInUser,
  refreshAccessToken,
  // TODO: Implement logout functionality
  // logoutUser,
} from '../services/AuthService';
import { SignUpDto } from '../DTO/SignUpDTO';
import { LogInDTO } from '../DTO/LogInDTO';
// TODO: Implement input validation
// import {
//   registerValidation,
//   loginValidation,
// } from '../utils/validation';
// import { validationErrorHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
// TODO: Implement rate limiting
// import { authRateLimiter } from '../middleware/rateLimiter';
import logger from '../utils/logger';
import prisma from '../db/prismaClient';

const router = express.Router();

router.post(
  '/internal/auth/register',
  // TODO: Add rate limiting middleware here
  // authRateLimiter,
  // TODO: Add input validation middleware here
  // registerValidation,
  // validationErrorHandler,
  async (req: Request, res: Response) => {
    const { username, password, repeatPassword, email } = req.body;

    try {
      const signUpDto = new SignUpDto(username, password, repeatPassword, email);
      const result = await registerUser(signUpDto);

      return res.status(result.status || 500).json({
        success: result.success,
        message: result.message,
      });
    } catch (err) {
      logger.error('Registration controller error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Public endpoint to inspect user list/count for testing only
router.get('/internal/auth/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true },
    });

    return res.status(200).json({
      success: true,
      message: 'User list for verification',
      count: users.length,
      users,
    });
  } catch (err) {
    logger.error('Fetch users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post(
  '/internal/auth/login',
  // TODO: Add rate limiting middleware here
  // authRateLimiter,
  // TODO: Add input validation middleware here
  // loginValidation,
  // validationErrorHandler,
  async (req: Request, res: Response) => {
    const { login, password } = req.body;

    try {
      const logInDTO = new LogInDTO(login, password);
      const result = await logInUser(logInDTO);

      return res.status(result.status || 500).json({
        success: result.success,
        message: result.message,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      logger.error('Login controller error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.post(
  '/internal/auth/refresh',
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    try {
      const result = await refreshAccessToken(refreshToken);
      return res.status(result.status || 500).json({
        success: result.success,
        message: result.message,
        accessToken: result.accessToken,
      });
    } catch (err) {
      logger.error('Token refresh controller error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// TODO: Implement logout functionality
// This endpoint should:
// 1. Accept refreshToken in request body
// 2. Extract accessToken from Authorization header
// 3. Delete refresh token from database
// 4. Blacklist access token in Redis
// 5. Return success response
router.post(
  '/internal/auth/logout',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    // TODO: Implement logout logic
    // const { refreshToken } = req.body;
    // const authHeader = req.headers['authorization'];
    // const accessToken = authHeader && authHeader.split(' ')[1];

    // if (!refreshToken) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Refresh token is required',
    //   });
    // }

    // try {
    //   const result = await logoutUser(refreshToken, accessToken);
    //   return res.status(result.status || 500).json({
    //     success: result.success,
    //     message: result.message,
    //   });
    // } catch (err) {
    //   logger.error('Logout controller error:', err);
    //   return res.status(500).json({
    //     success: false,
    //     message: 'Internal server error',
    //   });
    // }

    // Temporary response until logout is implemented
    return res.status(501).json({
      success: false,
      message: 'Logout functionality not yet implemented',
    });
  }
);

router.get(
  '/internal/auth/me',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      return res.status(200).json({
        success: true,
        data: {
          userId: req.userId,
          email: req.userEmail,
        },
      });
    } catch (err) {
      logger.error('Get user info error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// TODO: Implement Google OAuth authentication
// Google Sign-In/Sign-Up endpoints
// 
// This should include:
// 1. GET /internal/auth/google - Initiate Google OAuth flow (redirect to Google)
// 2. GET /internal/auth/google/callback - Handle Google OAuth callback
// 3. POST /internal/auth/google/token - Exchange Google token for JWT tokens
//
// Implementation steps:
// 1. Install passport and passport-google-oauth20: npm install passport passport-google-oauth20 @types/passport @types/passport-google-oauth20
// 2. Set up Google OAuth credentials in Google Cloud Console
// 3. Configure environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
// 4. Implement Google OAuth strategy
// 5. Create or find user based on Google profile
// 6. Generate JWT tokens (same as regular login)
// 7. Handle new user registration vs existing user login
//
// Example endpoint structure:
// router.get('/internal/auth/google', /* Google OAuth redirect */);
// router.get('/internal/auth/google/callback', /* Handle callback, create/login user, redirect with tokens */);
// router.post('/internal/auth/google/token', /* Exchange Google token for JWT */);

export default router;
