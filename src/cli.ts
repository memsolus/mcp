import { loadConfig } from '_config';
import { createServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const { server, transport } = await createServer(config);
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`[memsolus-mcp] Fatal: ${message}\n`);
  process.exit(1);
});
