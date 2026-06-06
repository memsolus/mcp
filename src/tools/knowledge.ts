import type { MemsolusClient } from '@memsolus/sdk';
import type { ToolDefinition } from './types.js';

export const getKnowledgeTool: ToolDefinition = {
  name: 'get_knowledge',
  description:
    "Get the consolidated knowledge profile built from processed memories. Use at the start of conversations to load the full context about a user or agent. Set merged=true (default) for a complete Markdown profile. Set merged=false to paginate through individual knowledge entries.",
  inputSchema: {
    type: 'object',
    properties: {
      user_id: { type: 'string', description: 'Filter knowledge by user ID' },
      category: { type: 'string', description: 'Filter knowledge by category' },
      merged: {
        type: 'string',
        enum: ['true', 'false'],
        description: 'Return merged Markdown profile (default true) or paginated entries',
      },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    const isMergedFalse = args['merged'] === 'false';

    return client.knowledge.list({
      merged: isMergedFalse ? false : true,
      ...(args['user_id'] !== undefined && { userId: args['user_id'] as string }),
      ...(args['category'] !== undefined && { category: args['category'] as string }),
    });
  },
};

export const getKnowledgeEntryTool: ToolDefinition = {
  name: 'get_knowledge_entry',
  description:
    'Retrieve a specific knowledge entry by ID. Use when you need the full details of a particular knowledge entry, including its source memory IDs.',
  inputSchema: {
    type: 'object',
    properties: {
      knowledge_id: { type: 'string', description: 'ID of the knowledge entry to retrieve' },
    },
    required: ['knowledge_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.knowledge.get({ id: args['knowledge_id'] as string });
  },
};
