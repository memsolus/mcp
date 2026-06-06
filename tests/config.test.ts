import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '_config';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return config when MEMSOLUS_API_KEY is defined', () => {
    process.env['MEMSOLUS_API_KEY'] = 'msk_test_key';

    const config = loadConfig();

    expect(config.apiKey).toBe('msk_test_key');
  });

  it('should throw when MEMSOLUS_API_KEY is not defined', () => {
    delete process.env['MEMSOLUS_API_KEY'];

    expect(() => loadConfig()).toThrow('MEMSOLUS_API_KEY environment variable is required');
  });

  it('should use default apiUrl when MEMSOLUS_API_URL is not set', () => {
    process.env['MEMSOLUS_API_KEY'] = 'msk_test_key';
    delete process.env['MEMSOLUS_API_URL'];

    const config = loadConfig();

    expect(config.apiUrl).toBe('https://api.memsolus.com');
  });

  it('should use custom apiUrl when MEMSOLUS_API_URL is set', () => {
    process.env['MEMSOLUS_API_KEY'] = 'msk_test_key';
    process.env['MEMSOLUS_API_URL'] = 'https://custom.memsolus.com';

    const config = loadConfig();

    expect(config.apiUrl).toBe('https://custom.memsolus.com');
  });

  it('should return undefined workspaceId when MEMSOLUS_WORKSPACE_ID is not set', () => {
    process.env['MEMSOLUS_API_KEY'] = 'msk_test_key';
    delete process.env['MEMSOLUS_WORKSPACE_ID'];

    const config = loadConfig();

    expect(config.workspaceId).toBeUndefined();
  });

  it('should return workspaceId when MEMSOLUS_WORKSPACE_ID is set', () => {
    process.env['MEMSOLUS_API_KEY'] = 'msk_test_key';
    process.env['MEMSOLUS_WORKSPACE_ID'] = 'ws_abc123';

    const config = loadConfig();

    expect(config.workspaceId).toBe('ws_abc123');
  });
});
