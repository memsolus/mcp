export interface McpConfig {
  readonly apiKey: string;
  readonly apiUrl: string;
  readonly workspaceId?: string;
}

export function loadConfig(): McpConfig {
  const apiKey = process.env['MEMSOLUS_API_KEY'];

  if (!apiKey) {
    throw new Error('MEMSOLUS_API_KEY environment variable is required');
  }

  const workspaceId = process.env['MEMSOLUS_WORKSPACE_ID'];
  const baseConfig = {
    apiKey,
    apiUrl: process.env['MEMSOLUS_API_URL'] ?? 'https://api.memsolus.com',
  };

  if (workspaceId !== undefined) {
    return { ...baseConfig, workspaceId };
  }

  return baseConfig;
}
