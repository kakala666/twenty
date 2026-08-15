import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  readApplicationVariable,
  requireApplicationVariable,
} from 'src/utils/read-application-variable.util';

const KEY = 'WAHA_BASE_URL';

describe('readApplicationVariable', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete process.env[KEY];
    delete process.env.applicationVariables;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // The function executor merges every declared server variable straight into
  // the sandbox environment under its own key.
  it('should read the plain environment variable', () => {
    process.env[KEY] = 'https://waha.example.com';

    expect(readApplicationVariable(KEY)).toBe('https://waha.example.com');
  });

  it('should prefer the applicationVariables blob over the plain environment', () => {
    process.env[KEY] = 'https://from-env.example.com';
    process.env.applicationVariables = JSON.stringify({
      [KEY]: 'https://from-blob.example.com',
    });

    expect(readApplicationVariable(KEY)).toBe('https://from-blob.example.com');
  });

  it('should fall back to the environment when the blob has no entry for the key', () => {
    process.env[KEY] = 'https://from-env.example.com';
    process.env.applicationVariables = JSON.stringify({ OTHER: 'x' });

    expect(readApplicationVariable(KEY)).toBe('https://from-env.example.com');
  });

  it('should fall back to the environment when the blob is not valid json', () => {
    process.env[KEY] = 'https://from-env.example.com';
    process.env.applicationVariables = 'not json';

    expect(readApplicationVariable(KEY)).toBe('https://from-env.example.com');
  });

  it('should treat an empty value as absent', () => {
    process.env[KEY] = '';

    expect(readApplicationVariable(KEY)).toBeUndefined();
  });

  it('should return undefined when the variable is set nowhere', () => {
    expect(readApplicationVariable(KEY)).toBeUndefined();
  });
});

describe('requireApplicationVariable', () => {
  it('should throw a message naming the key when the variable is missing', () => {
    delete process.env.WAHA_API_KEY;

    expect(() => requireApplicationVariable('WAHA_API_KEY')).toThrow(
      /WAHA_API_KEY/,
    );
  });

  it('should never put the value in the error message', () => {
    delete process.env.WAHA_API_KEY;

    expect(() => requireApplicationVariable('WAHA_API_KEY')).toThrow(
      /Missing required application variable/,
    );
  });
});
