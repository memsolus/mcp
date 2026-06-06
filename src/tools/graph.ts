import type { MemsolusClient, EntityType } from '@memsolus/sdk';
import type { ToolDefinition } from './types.js';

type TraverseDirection = 'inbound' | 'outbound' | 'both';

function mapDirection(direction: unknown): TraverseDirection | undefined {
  if (direction === 'outgoing') {
    return 'outbound';
  }
  if (direction === 'incoming') {
    return 'inbound';
  }
  if (direction === 'both') {
    return 'both';
  }
  return undefined;
}

export const graphSearchTool: ToolDefinition = {
  name: 'graph_search',
  description:
    'Search for entities in the knowledge graph. Use when you need to find people, organizations, places, or things mentioned across memories. Useful before traversing relationships or querying the graph.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Text query to search for entities' },
      user_id: { type: 'string', description: 'Filter entities by user ID' },
      type: {
        type: 'string',
        enum: ['PERSON', 'ORGANIZATION', 'PLACE', 'THING'],
        description: 'Filter entities by type',
      },
      limit: { type: 'string', description: 'Maximum number of results to return (default 10)' },
    },
    required: ['query'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.graph.search({
      query: args['query'] as string,
      ...(args['user_id'] !== undefined && { userId: args['user_id'] as string }),
      ...(args['type'] !== undefined && { type: args['type'] as EntityType }),
      ...(args['limit'] !== undefined && { limit: Number(args['limit']) }),
    });
  },
};

export const graphTraverseTool: ToolDefinition = {
  name: 'graph_traverse',
  description:
    "Traverse relationships from a known entity in the knowledge graph. Use when you want to explore what an entity is connected to — colleagues, projects, organizations. Use graph_search first if you need to find the entity_id.",
  inputSchema: {
    type: 'object',
    properties: {
      entity_id: { type: 'string', description: 'ID of the starting entity' },
      direction: {
        type: 'string',
        enum: ['outgoing', 'incoming', 'both'],
        description: 'Traversal direction (default: both)',
      },
      hops: { type: 'string', description: 'Traversal depth: 1-3 (default 2)' },
    },
    required: ['entity_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    const mappedDirection = mapDirection(args['direction']);

    return client.graph.traverse({
      entityId: args['entity_id'] as string,
      ...(mappedDirection !== undefined && { direction: mappedDirection }),
      ...(args['hops'] !== undefined && { hops: Number(args['hops']) }),
    });
  },
};

export const graphQueryTool: ToolDefinition = {
  name: 'graph_query',
  description:
    "Answer a natural language question using the knowledge graph. Use for complex relational questions like 'What projects is João involved in?' or 'Who works at Acme Corp?'. Returns an answer with confidence score and which entities were used.",
  inputSchema: {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'Natural language question to answer using the graph' },
    },
    required: ['question'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.graph.query({ question: args['question'] as string });
  },
};
