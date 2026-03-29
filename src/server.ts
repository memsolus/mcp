import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClient } from './api-client.js';
import type { ApiClientConfig } from './api-client.js';
import { registerTools } from './tools.js';

export interface MemsolusMcpConfig extends ApiClientConfig {
  serverName?: string;
  serverVersion?: string;
}

export function createServer(config: MemsolusMcpConfig): McpServer {
  const client = new ApiClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
  });

  const server = new McpServer({
    name: config.serverName || 'memsolus',
    version: config.serverVersion || '0.1.0',
  });

  registerTools(server, client);

  return server;
}
