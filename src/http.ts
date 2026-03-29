#!/usr/bin/env node

import { createServer as createHttpServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { loadConfig } from './config.js';

const PORT = parseInt(process.env.PORT || '3200', 10);

async function main() {
  const config = loadConfig();

  const httpServer = createHttpServer(async (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.url !== '/mcp') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const mcpServer = createServer(config);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await mcpServer.connect(transport);

    await transport.handleRequest(req, res);
  });

  httpServer.listen(PORT, () => {
    console.log(`Memsolus MCP server listening on http://localhost:${PORT}/mcp`);
  });
}

main().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
