import { Context } from 'koa';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getCurrentUser = async (ctx: Context) => {
  try {
    const userId = ctx.state.user.userId;

    if (!userId) {
      throw createError(
        'User ID not found in authentication context',
        401,
        'authentication_error'
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { shortLinks: true }
        }
      }
    });

    if (!user) {
      throw createError(
        'User account not found. This may indicate the account was deleted',
        404,
        'user_not_found',
        { userId }
      );
    }

    ctx.status = 200;
    ctx.body = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      shortLinksCount: user._count.shortLinks,
      shortLinksQuota: 100 // You can make this configurable
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const updateUser = async (ctx: Context) => {
  try {
    const userId = ctx.state.user.userId;
    const { name, email } = ctx.request.body as {
      name?: string;
      email?: string;
    };

    // Validate input
    if (!name && !email) {
      throw createError(
        'At least one field (name or email) must be provided for update',
        400,
        'validation_error',
        { requiredFields: ['name', 'email'] }
      );
    }

    if (name && (name.length < 2 || name.length > 100)) {
      throw createError(
        'Name must be between 2 and 100 characters long',
        400,
        'validation_error',
        { field: 'name', minLength: 2, maxLength: 100, providedLength: name.length }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError(
        'Invalid email format',
        400,
        'validation_error',
        { field: 'email', providedEmail: email }
      );
    }

    const updateData: { name?: string; email?: string } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    ctx.status = 200;
    ctx.body = {
      email: user.email,
      name: user.name
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const getUserLinks = async (ctx: Context) => {
  try {
    const userId = ctx.state.user.userId;
    const page = parseInt(ctx.query.page as string) || 1;
    const limit = parseInt(ctx.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      throw createError(
        'Page number must be greater than 0',
        400,
        'validation_error',
        { field: 'page', minValue: 1, providedValue: page }
      );
    }

    if (limit < 1 || limit > 100) {
      throw createError(
        'Limit must be between 1 and 100',
        400,
        'validation_error',
        { field: 'limit', minValue: 1, maxValue: 100, providedValue: limit }
      );
    }

    const offset = (page - 1) * limit;

    const [links, total] = await Promise.all([
      prisma.shortLink.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.shortLink.count({
        where: { userId }
      })
    ]);

    // Check if page exceeds available pages
    const totalPages = Math.ceil(total / limit);
    if (page > totalPages && total > 0) {
      throw createError(
        'Page number exceeds available pages',
        400,
        'validation_error',
        { requestedPage: page, totalPages, totalItems: total }
      );
    }

    ctx.status = 200;
    ctx.body = {
      links: links.map(link => ({
        slug: link.slug,
        originalUrl: link.originalUrl,
        clickCount: link.clickCount,
        createdAt: link.createdAt,
        shortUrl: `${ctx.request.protocol}://${ctx.request.host}/${link.slug}`
      })),
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const updatePassword = async (ctx: Context) => {
  try {
    const userId = ctx.state.user.userId;
    const { currentPassword, newPassword } = ctx.request.body as {
      currentPassword: string;
      newPassword: string;
    };

    // Validate input
    if (!currentPassword || !newPassword) {
      throw createError(
        'Both currentPassword and newPassword are required',
        400,
        'validation_error',
        { requiredFields: ['currentPassword', 'newPassword'] }
      );
    }

    if (newPassword.length < 8) {
      throw createError(
        'New password must be at least 8 characters long',
        400,
        'validation_error',
        { field: 'newPassword', minLength: 8, providedLength: newPassword.length }
      );
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      throw createError(
        'User account not found. This may indicate the account was deleted',
        404,
        'user_not_found',
        { userId }
      );
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw createError(
        'Current password is incorrect',
        400,
        'bad_request',
        { field: 'currentPassword' }
      );
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and delete all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: newHashedPassword }
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: userId }
      })
    ]);

    ctx.status = 200;
    ctx.body = {
      message: 'Password updated successfully'
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};