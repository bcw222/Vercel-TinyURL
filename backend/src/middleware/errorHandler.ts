import { Context, Next } from 'koa';

export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export const createError = (
  message: string,
  status: number = 500,
  code: string = 'internal_server_error',
  details?: any
): AppError => {
  const error = new Error(message) as AppError;
  error.status = status;
  error.code = code;
  error.details = details;
  error.isOperational = true;
  return error;
};

export const errorHandler = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error: any) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Default error response
    let status = 500;
    let code = 'internal_server_error';
    let message = 'An internal server error occurred';
    let details: any = undefined;

    if (error.isOperational) {
      // Operational errors (expected errors)
      status = error.status || 500;
      code = error.code || 'internal_server_error';
      message = error.message || 'An error occurred';
      details = error.details;
    } else if (error.name === 'ValidationError') {
      // Mongoose validation error
      status = 422;
      code = 'validation_error';
      message = 'Validation failed';
      details = error.errors;
    } else if (error.name === 'JsonWebTokenError') {
      // JWT errors
      status = 401;
      code = 'invalid_token';
      message = 'Invalid or malformed token';
    } else if (error.name === 'TokenExpiredError') {
      // JWT expired
      status = 401;
      code = 'token_expired';
      message = 'Token has expired';
    } else if (error.code === 'P2002') {
      // Prisma unique constraint violation
      status = 409;
      code = 'unique_constraint_violation';
      message = 'A record with this information already exists';
      details = { field: error.meta?.target };
    } else if (error.code === 'P2025') {
      // Prisma record not found
      status = 404;
      code = 'not_found';
      message = 'Record not found';
    } else if (error.code === 'P1001') {
      // Prisma database connection error
      status = 503;
      code = 'database_unavailable';
      message = 'Database temporarily unavailable';
    } else {
      // Unexpected errors
      console.error('Unexpected error:', error);
    }

    // Log error details in development
    if (isDevelopment) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta,
        details: error.details
      });
    }

    // Build error response
    const errorResponse: any = {
      error: code,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.path,
      method: ctx.method
    };

    // Add details in development or for specific error types
    if (isDevelopment || (details && ['validation_error', 'unique_constraint_violation'].includes(code))) {
      errorResponse.details = details;
    }

    // Add stack trace in development
    if (isDevelopment && error.stack) {
      errorResponse.stack = error.stack;
    }

    ctx.status = status;
    ctx.body = errorResponse;
  }
};