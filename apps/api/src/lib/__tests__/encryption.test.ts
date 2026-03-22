import { describe, it, expect } from 'vitest';

import { encrypt, decrypt, maskConnectionUrl } from '../encryption.js';

describe('encrypt and decrypt', () => {
  const secret = 'test-secret-key-for-encryption';

  it('roundtrips a simple string', () => {
    const plaintext = 'hello world';
    const ciphertext = encrypt(plaintext, secret);
    expect(decrypt(ciphertext, secret)).toBe(plaintext);
  });

  it('roundtrips special characters and unicode', () => {
    const plaintext = '안녕하세요! 🔐 café résumé — "quotes" & <tags>';
    const ciphertext = encrypt(plaintext, secret);
    expect(decrypt(ciphertext, secret)).toBe(plaintext);
  });

  it('roundtrips an empty string', () => {
    const ciphertext = encrypt('', secret);
    expect(decrypt(ciphertext, secret)).toBe('');
  });

  it('produces different ciphertexts with different secrets', () => {
    const plaintext = 'same input';
    const ciphertext1 = encrypt(plaintext, 'secret-one');
    const ciphertext2 = encrypt(plaintext, 'secret-two');
    expect(ciphertext1).not.toBe(ciphertext2);
  });

  it('throws when decrypting with wrong secret', () => {
    const ciphertext = encrypt('sensitive data', 'correct-secret');
    expect(() => decrypt(ciphertext, 'wrong-secret')).toThrow();
  });

  it('throws when ciphertext format is invalid (not 3 parts)', () => {
    expect(() => decrypt('only-one-part', secret)).toThrow('Invalid ciphertext format');
    expect(() => decrypt('part1:part2', secret)).toThrow('Invalid ciphertext format');
    expect(() => decrypt('a:b:c:d', secret)).toThrow('Invalid ciphertext format');
  });
});

describe('maskConnectionUrl', () => {
  it('masks password in a valid URL', () => {
    const url = 'postgresql://user:mysecretpassword@localhost:5432/mydb';
    const masked = maskConnectionUrl(url);
    expect(masked).toContain('****');
    expect(masked).not.toContain('mysecretpassword');
    expect(masked).toContain('user');
    expect(masked).toContain('localhost');
  });

  it('returns URL unchanged when there is no password', () => {
    const url = 'postgresql://localhost:5432/mydb';
    const masked = maskConnectionUrl(url);
    expect(masked).not.toContain('****');
  });

  it('masks after protocol for invalid URL containing ://', () => {
    const url = 'postgres://not a valid url';
    const masked = maskConnectionUrl(url);
    expect(masked).toBe('postgres://****');
  });

  it('returns **** for completely invalid URL without ://', () => {
    const masked = maskConnectionUrl('totally-invalid');
    expect(masked).toBe('****');
  });
});
