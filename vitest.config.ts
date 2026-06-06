import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      _tools: resolve(__dirname, 'src/tools'),
      _resources: resolve(__dirname, 'src/resources'),
      _prompts: resolve(__dirname, 'src/prompts'),
      _config: resolve(__dirname, 'src/config'),
      _entitlements: resolve(__dirname, 'src/entitlements'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    server: {
      deps: {
        external: ['@modelcontextprotocol/sdk'],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/cli.ts', 'src/index.ts'],
    },
  },
});
