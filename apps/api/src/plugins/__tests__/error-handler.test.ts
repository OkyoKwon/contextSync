import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../error-handler.plugin.js';

describe('AppError', () => {
  it('has default statusCode of 400', () => {
    const error = new AppError('bad request');
    expect(error.statusCode).toBe(400);
  });

  it('accepts a custom statusCode', () => {
    const error = new AppError('conflict', 409);
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('conflict');
  });

  it('has name set to AppError', () => {
    const error = new AppError('test');
    expect(error.name).toBe('AppError');
  });

  it('is an instanceof Error', () => {
    const error = new AppError('test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404', () => {
    const error = new NotFoundError('Project');
    expect(error.statusCode).toBe(404);
  });

  it('formats message as "{resource} not found"', () => {
    const error = new NotFoundError('Session');
    expect(error.message).toBe('Session not found');
  });
});

describe('UnauthorizedError', () => {
  it('has default message "Unauthorized" and statusCode 401', () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe('Unauthorized');
    expect(error.statusCode).toBe(401);
  });
});

describe('ForbiddenError', () => {
  it('has default message "Forbidden" and statusCode 403', () => {
    const error = new ForbiddenError();
    expect(error.message).toBe('Forbidden');
    expect(error.statusCode).toBe(403);
  });
});
