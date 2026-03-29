import type { MemsolusMcpConfig } from './server.js';

export function loadConfig(): MemsolusMcpConfig {
  const apiKey = process.env.MEMSOLUS_API_KEY;
  if (!apiKey) {
    console.error('Error: MEMSOLUS_API_KEY environment variable is required.');
    console.error('');
    console.error('Get your API key at https://app.memsolus.com/api-keys');
    process.exit(1);
  }

  const baseUrl = process.env.MEMSOLUS_API_URL || 'https://api.memsolus.com';

  return {
    baseUrl,
    apiKey,
  };
}
