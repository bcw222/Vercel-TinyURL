import { Context } from 'koa';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

export const register = async (ctx: Context) => {
  try {
    const { email, password, name } = ctx.request.body as {
      email: string;
      password: string;
      name: string;
    };

    // Validate input
    if (!email || !password || !name) {
      const body = ctx.request.body as any;
      throw createError(
        'Email, password, and name are required',
        400,
        'validation_error',
        { missingFields: ['email', 'password', 'name'].filter(field => !body[field]) }
      );
    }

    if (password.length < 6) {
      throw createError(
        'Password must be at least 6 characters long',
        400,
        'validation_error',
        { field: 'password', minLength: 6 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError(
        'User with this email already exists',
        409,
        'user_already_exists',
        { email }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, salt: nanoid() },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    ctx.status = 201;
    ctx.body = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      refreshToken,
      accessToken
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const login = async (ctx: Context) => {
  try {
    const { email, password } = ctx.request.body as {
      email: string;
      password: string;
    };

    // Validate input
    if (!email || !password) {
      const body = ctx.request.body as any;
      throw createError(
        'Email and password are required',
        400,
        'validation_error',
        { missingFields: ['email', 'password'].filter(field => !body[field]) }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw createError(
        'Invalid email or password',
        401,
        'invalid_credentials'
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError(
        'Invalid email or password',
        401,
        'invalid_credentials'
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, salt: nanoid() },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    ctx.status = 200;
    ctx.body = {
      refreshToken,
      accessToken
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const refresh = async (ctx: Context) => {
  try {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(
        'Refresh token required in Authorization header',
        401,
        'missing_refresh_token',
        { headerFormat: 'Bearer <refresh_token>' }
      );
    }

    const refreshToken = authHeader.substring(7);

    if (!refreshToken) {
      throw createError(
        'Refresh token is empty',
        401,
        'invalid_refresh_token'
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!storedToken) {
      throw createError(
        'Refresh token not found',
        401,
        'invalid_refresh_token'
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw createError(
        'Refresh token has expired',
        401,
        'expired_refresh_token',
        { expiredAt: storedToken.expiresAt }
      );
    }

    // Generate new access token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw createError(
        'User associated with refresh token not found',
        401,
        'user_not_found'
      );
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    ctx.status = 200;
    ctx.body = {
      accessToken
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const logout = async (ctx: Context) => {
  try {
    const { refreshToken, accessToken } = ctx.request.body as {
      refreshToken?: string;
      accessToken?: string;
    };

    // Validate input
    if (!refreshToken) {
      throw createError(
        'Refresh token is required for logout',
        400,
        'validation_error',
        { requiredField: 'refreshToken' }
      );
    }

    // Remove refresh token from database
    const deletedCount = await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });

    if (deletedCount.count === 0) {
      throw createError(
        'Refresh token not found or already invalidated',
        404,
        'token_not_found'
      );
    }

    ctx.status = 204;
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};