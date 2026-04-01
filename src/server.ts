import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClient } from './api-client.js';
import type { ApiClientConfig } from './api-client.js';
import { registerTools } from './tools.js';

export interface MemsolusMcpConfig extends ApiClientConfig {
  serverName?: string;
  serverVersion?: string;
  instructions?: string;
}

const DEFAULT_INSTRUCTIONS = `Memsolus is a persistent memory system with vector search. Use it to store and retrieve information across conversations.

## When to use

- **Start of conversation**: Call get_knowledge (merged=true) to load the user's full context profile before responding.
- **User shares a fact, preference, or decision**: Call add_memory to store it. Write clear, standalone statements — not conversation fragments.
- **You need past context**: Call search_memories with a specific natural language query. Prefer "hybrid" mode for general queries, "keyword" for exact names/IDs.
- **User says "remember this" or "don't forget"**: Call add_memory with priority HIGH.
- **User says "forget this" or asks to remove info**: Call delete_memory with the specific ID (search first if needed).
- **User corrects something**: Call update_memory on the existing memory rather than creating a new one.

## When NOT to use

- Do NOT store temporary or session-specific info (e.g., "user asked about X" — that's conversation context, not a memory).
- Do NOT store greetings, filler, or acknowledgments.
- Do NOT call search_memories for every message — only when you actually need stored context.

## Memory quality guidelines

- Write each memory as a complete, self-contained statement that makes sense without other memories.
- Use the same language as the user. If they speak Portuguese, store in Portuguese.
- For important rules or preferences, use priority HIGH.
- For supplementary context, use priority LOW.

## Tool selection guide

| Need | Tool |
|------|------|
| Load full user profile at conversation start | get_knowledge (merged=true) |
| Find specific info by topic | search_memories |
| Store new information | add_memory |
| Correct/update existing info | update_memory |
| Remove wrong/outdated info | delete_memory |
| Browse all memories chronologically | get_memories |
| Discover who/what is in the knowledge graph | graph_search |
| Explore relationships from an entity | graph_traverse |
| Ask complex relationship questions | graph_query |
| Team/shared context | search_pool, add_memory_to_pool |`;

export function createServer(config: MemsolusMcpConfig): McpServer {
  const client = new ApiClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
  });

  const server = new McpServer(
    {
      name: config.serverName || 'memsolus',
      version: config.serverVersion || '0.1.0',
    },
    {
      instructions: config.instructions || DEFAULT_INSTRUCTIONS,
    },
  );

  registerTools(server, client);

  return server;
}
