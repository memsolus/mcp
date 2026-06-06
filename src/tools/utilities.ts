import type { MemsolusClient } from '@memsolus/sdk';
import type { ToolDefinition } from './types.js';

export const getDashboardSummaryTool: ToolDefinition = {
  name: 'get_dashboard_summary',
  description:
    'Get workspace KPIs — total memories, searches, tokens used — with comparison to the previous period. Use when the user asks for usage statistics or wants an overview of the workspace activity.',
  inputSchema: {
    type: 'object',
    properties: {
      days: { type: 'string', description: 'Time window in days (default 30)' },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    if (args['days'] !== undefined) {
      return client.dashboard.summary({ days: Number(args['days']) });
    }

    return client.dashboard.summary({});
  },
};

export const getMemoryProfileTool: ToolDefinition = {
  name: 'get_memory_profile',
  description:
    'Get a summarized profile of a user built from their memories — key topics, entity count, and a narrative summary. Use when you need a quick overview of what is known about a specific user before diving into their memories.',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: { type: 'string', description: 'ID of the user to retrieve profile for' },
    },
    required: ['user_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.profiles.get({ userId: args['user_id'] as string });
  },
};

export const listEntitiesTool: ToolDefinition = {
  name: 'list_entities',
  description:
    'List all users and agents in the workspace with their memory counts. Use when you need to discover who has memories stored or compare activity across entities.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (_args: Record<string, unknown>, client: MemsolusClient) => {
    return client.entities.list();
  },
};
