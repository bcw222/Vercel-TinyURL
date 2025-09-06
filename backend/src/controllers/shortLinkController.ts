import { Context } from 'koa';
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const createShortLink = async (ctx: Context) => {
  try {
    const { originalUrl, customStub } = ctx.request.body as {
      originalUrl: string;
      customStub?: string;
    };

    const userId = ctx.state.user?.userId;

    // Validate input
    if (!originalUrl) {
      throw createError(
        'Original URL is required',
        400,
        'validation_error',
        { requiredField: 'originalUrl' }
      );
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch {
      throw createError(
        'Invalid URL format. Please provide a valid URL (e.g., https://example.com)',
        422,
        'invalid_url_format',
        { providedUrl: originalUrl }
      );
    }

    // Validate custom slug format
    if (customStub) {
      // Check if slug is reserved (starts with /api)
      if (customStub.startsWith('/api')) {
        throw createError(
          'Custom slug cannot start with /api as it conflicts with API routes',
          400,
          'invalid_slug_format',
          { slug: customStub }
        );
      }
      
      // Check if slug length is valid (1-50 characters)
      if (customStub.length < 1 || customStub.length > 50) {
        throw createError(
          'Custom slug must be between 1 and 50 characters long',
          400,
          'invalid_slug_length',
          { minLength: 1, maxLength: 50, providedLength: customStub.length }
        );
      }
    }

    let slug = customStub || nanoid(8);

    // Check if slug already exists
    const existingLink = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (existingLink) {
      if (customStub) {
        throw createError(
          'Custom slug already exists. Please choose a different slug',
          409,
          'slug_already_exists',
          { slug: customStub }
        );
      } else {
        // Generate new slug if collision (should be very rare with nanoid)
        slug = nanoid(8);
      }
    }

    const shortLink = await prisma.shortLink.create({
      data: {
        slug,
        originalUrl,
        userId
      }
    });

    ctx.status = 201;
    ctx.body = {
      slug: shortLink.slug,
      originalUrl: shortLink.originalUrl,
      shortUrl: `${ctx.request.protocol}://${ctx.request.host}/${shortLink.slug}`
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const getShortLinkInfo = async (ctx: Context) => {
  try {
    const { slug } = ctx.params;

    // Validate slug
    if (!slug) {
      throw createError(
        'Slug parameter is required',
        400,
        'validation_error',
        { requiredParameter: 'slug' }
      );
    }

    const shortLink = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (!shortLink) {
      throw createError(
        'Short link not found',
        404,
        'short_link_not_found',
        { slug }
      );
    }

    ctx.status = 200;
    ctx.body = {
      slug: shortLink.slug,
      originalUrl: shortLink.originalUrl,
      clickCount: shortLink.clickCount,
      createdAt: shortLink.createdAt,
      lastAccessedAt: shortLink.lastAccessedAt,
      shortUrl: `${ctx.request.protocol}://${ctx.request.host}/${shortLink.slug}`
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const updateShortLink = async (ctx: Context) => {
  try {
    const { slug } = ctx.params;
    const { originalUrl, customStub } = ctx.request.body as {
      originalUrl?: string;
      customStub?: string;
    };

    const userId = ctx.state.user.userId;

    // Validate slug parameter
    if (!slug) {
      throw createError(
        'Slug parameter is required',
        400,
        'validation_error',
        { requiredParameter: 'slug' }
      );
    }

    // Validate that at least one field is provided
    if (!originalUrl && !customStub) {
      throw createError(
        'At least one field (originalUrl or customStub) must be provided for update',
        400,
        'validation_error',
        { requiredFields: ['originalUrl', 'customStub'] }
      );
    }

    const shortLink = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (!shortLink) {
      throw createError(
        'Short link not found',
        404,
        'short_link_not_found',
        { slug }
      );
    }

    if (shortLink.userId !== userId) {
      throw createError(
        'You do not have permission to update this short link',
        403,
        'access_denied',
        { slug, ownerId: shortLink.userId }
      );
    }

    // Validate URL if provided
    if (originalUrl) {
      try {
        new URL(originalUrl);
      } catch {
        throw createError(
          'Invalid URL format for originalUrl',
          422,
          'invalid_url_format',
          { providedUrl: originalUrl }
        );
      }
    }

    // Validate custom slug if provided
    if (customStub) {
      // Check if slug is reserved (starts with /api)
      if (customStub.startsWith('/api')) {
        throw createError(
          'Custom slug cannot start with /api as it conflicts with API routes',
          400,
          'invalid_slug_format',
          { slug: customStub }
        );
      }
      
      // Check if slug length is valid (1-50 characters)
      if (customStub.length < 1 || customStub.length > 50) {
        throw createError(
          'Custom slug must be between 1 and 50 characters long',
          400,
          'invalid_slug_length',
          { minLength: 1, maxLength: 50, providedLength: customStub.length }
        );
      }

      // Check if new slug already exists
      const existingLink = await prisma.shortLink.findUnique({
        where: { slug: customStub }
      });
      if (existingLink && existingLink.id !== shortLink.id) {
        throw createError(
          'Custom slug already exists',
          409,
          'slug_already_exists',
          { slug: customStub }
        );
      }
    }

    const updateData: { originalUrl?: string; slug?: string } = {};
    if (originalUrl) updateData.originalUrl = originalUrl;
    if (customStub) updateData.slug = customStub;

    const updatedLink = await prisma.shortLink.update({
      where: { id: shortLink.id },
      data: updateData
    });

    ctx.status = 200;
    ctx.body = {
      slug: updatedLink.slug,
      originalUrl: updatedLink.originalUrl,
      updatedAt: updatedLink.updatedAt,
      shortUrl: `${ctx.request.protocol}://${ctx.request.host}/${updatedLink.slug}`
    };
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const deleteShortLink = async (ctx: Context) => {
  try {
    const { slug } = ctx.params;
    const userId = ctx.state.user.userId;

    // Validate slug parameter
    if (!slug) {
      throw createError(
        'Slug parameter is required',
        400,
        'validation_error',
        { requiredParameter: 'slug' }
      );
    }

    const shortLink = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (!shortLink) {
      throw createError(
        'Short link not found',
        404,
        'short_link_not_found',
        { slug }
      );
    }

    if (shortLink.userId !== userId) {
      throw createError(
        'You do not have permission to delete this short link',
        403,
        'access_denied',
        { slug, ownerId: shortLink.userId }
      );
    }

    await prisma.shortLink.delete({
      where: { id: shortLink.id }
    });

    ctx.status = 204;
  } catch (error) {
    throw error; // Let the error handler middleware deal with it
  }
};

export const redirectToOriginal = async (ctx: Context) => {
  try {
    const { slug } = ctx.params;

    const shortLink = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (!shortLink) {
      const fallbackUrl = process.env.FALLBACK_URL || 'https://example.com/404';
      ctx.status = 302;
      ctx.redirect(fallbackUrl);
      return;
    }

    // Increment click count and update last accessed
    await prisma.shortLink.update({
      where: { id: shortLink.id },
      data: {
        clickCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    ctx.status = 302;
    ctx.redirect(shortLink.originalUrl);
  } catch (error) {
    const fallbackUrl = process.env.FALLBACK_URL || 'https://example.com/error';
    ctx.status = 302;
    ctx.redirect(fallbackUrl);
  }
};