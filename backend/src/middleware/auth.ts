import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async (ctx: Context, next: Next) => {
  try {
    const authHeader = ctx.headers.authorization;

    if (!authHeader) {
      throw createError(
        'Authorization header is required',
        401,
        'missing_authorization_header',
        { expectedFormat: 'Bearer <access_token>' }
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw createError(
        'Authorization header must start with "Bearer "',
        401,
        'invalid_authorization_format',
        { providedHeader: authHeader.substring(0, 20) + '...', expectedFormat: 'Bearer <access_token>' }
      );
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw createError(
        'Access token is empty',
        401,
        'empty_access_token'
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
      };

      ctx.state.user = decoded;
      await next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        throw createError(
          'Access token has expired',
          401,
          'token_expired',
          { expiredAt: jwtError.expiredAt }
        );
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw createError(
          'Invalid access token format',
          401,
          'invalid_token_format',
          { error: jwtError.message }
        );
      } else {
        throw createError(
          'Access token verification failed',
          401,
          'token_verification_failed'
        );
      }
    }
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const optionalAuth = async (ctx: Context, next: Next) => {
  const authHeader = ctx.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
        };
        ctx.state.user = decoded;
      } catch (jwtError) {
        // For optional auth, we silently ignore JWT errors
        // and continue without authentication
      }
    }
  }
  await next();
};