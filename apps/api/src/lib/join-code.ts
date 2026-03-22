import crypto from 'node:crypto';

/**
 * Generate a 6-character uppercase alphanumeric join code.
 */
export function generateJoinCode(): string {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6).toUpperCase();
}
