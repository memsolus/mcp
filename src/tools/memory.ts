import type { MemsolusClient, MemoryPriority, SearchMode, FeedbackSignal } from '@memsolus/sdk';
import type { ToolDefinition } from './types.js';

export const addMemoryTool: ToolDefinition = {
  name: 'add_memory',
  description:
    'Store a new persistent memory. Use when the user shares a fact, preference, decision, or any context worth remembering across conversations. Write clear, self-contained statements. Do NOT store temporary info, greetings, or session-specific context that won\'t be useful in future conversations.',
  inputSchema: {
    type: 'object',
    properties: {
      memory: { type: 'string', description: 'Content of the memory to store' },
      user_id: { type: 'string', description: 'ID of the user associated with this memory' },
      agent_id: { type: 'string', description: 'ID of the agent associated with this memory' },
      session_id: { type: 'string', description: 'ID of the current session' },
      metadata: { type: 'string', description: 'JSON string with arbitrary metadata' },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        description: 'Memory priority (default: MEDIUM)',
      },
    },
    required: ['memory'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    let parsedMetadata: Record<string, unknown> | undefined;

    if (args['metadata']) {
      try {
        parsedMetadata = JSON.parse(args['metadata'] as string) as Record<string, unknown>;
      } catch {
        throw new Error('metadata must be valid JSON string');
      }
    }

    return client.memories.create({
      content: args['memory'] as string,
      ...(args['user_id'] !== undefined && { userId: args['user_id'] as string }),
      ...(args['agent_id'] !== undefined && { agentId: args['agent_id'] as string }),
      ...(args['session_id'] !== undefined && { sessionId: args['session_id'] as string }),
      ...(parsedMetadata !== undefined && { metadata: parsedMetadata }),
      ...(args['priority'] !== undefined && { priority: args['priority'] as MemoryPriority }),
    });
  },
};

export const searchMemoriesTool: ToolDefinition = {
  name: 'search_memories',
  description:
    'Search across stored memories using semantic, keyword, or hybrid search. Use when you need past context about a specific topic, person, project, or decision. Prefer \'hybrid\' mode for general queries. Use \'keyword\' mode for exact names, IDs, or terms. Do NOT call this for every message — only when you genuinely need stored context.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query in natural language' },
      user_id: { type: 'string', description: 'Filter results by user ID' },
      limit: { type: 'string', description: 'Maximum number of results to return (default 10)' },
      mode: {
        type: 'string',
        enum: ['hybrid', 'semantic', 'keyword'],
        description: 'Search mode: hybrid (default), semantic, or keyword',
      },
    },
    required: ['query'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.search({
      query: args['query'] as string,
      ...(args['user_id'] !== undefined && { userId: args['user_id'] as string }),
      ...(args['limit'] !== undefined && { limit: Number(args['limit']) }),
      ...(args['mode'] !== undefined && { mode: args['mode'] as SearchMode }),
    });
  },
};

export const getMemoriesTool: ToolDefinition = {
  name: 'get_memories',
  description:
    'List memories chronologically. Use when you need to browse all stored memories rather than search by relevance. Prefer search_memories for finding specific information.',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: { type: 'string', description: 'Filter results by user ID' },
      agent_id: { type: 'string', description: 'Filter results by agent ID' },
      page: { type: 'string', description: 'Page number (default 1)' },
      limit: { type: 'string', description: 'Results per page (default 20)' },
    },
    required: [],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.list({
      ...(args['user_id'] !== undefined && { userId: args['user_id'] as string }),
      ...(args['agent_id'] !== undefined && { agentId: args['agent_id'] as string }),
      ...(args['page'] !== undefined && { page: Number(args['page']) }),
      ...(args['limit'] !== undefined && { limit: Number(args['limit']) }),
    });
  },
};

export const getMemoryTool: ToolDefinition = {
  name: 'get_memory',
  description:
    'Retrieve a specific memory by ID. Use when you already know the memory ID from a previous search or list result and need its full details.',
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: { type: 'string', description: 'ID of the memory to retrieve' },
    },
    required: ['memory_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.get({ id: args['memory_id'] as string });
  },
};

export const updateMemoryTool: ToolDefinition = {
  name: 'update_memory',
  description:
    "Update an existing memory's content or priority. Use when the user corrects information or provides a more accurate version of something already stored. Prefer updating over creating a duplicate memory for the same fact.",
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: { type: 'string', description: 'ID of the memory to update' },
      memory: { type: 'string', description: 'New content for the memory' },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        description: 'New priority for the memory',
      },
    },
    required: ['memory_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.update({
      id: args['memory_id'] as string,
      ...(args['memory'] !== undefined && { content: args['memory'] as string }),
      ...(args['priority'] !== undefined && { priority: args['priority'] as MemoryPriority }),
    });
  },
};

export const deleteMemoryTool: ToolDefinition = {
  name: 'delete_memory',
  description:
    "Permanently delete a memory. Use when the user explicitly asks to forget something, or when a memory is clearly outdated and no longer relevant. Search for the memory first if you don't have the ID.",
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: { type: 'string', description: 'ID of the memory to delete' },
    },
    required: ['memory_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.delete({ id: args['memory_id'] as string });
  },
};

export const promoteMemoryTool: ToolDefinition = {
  name: 'promote_memory',
  description:
    'Promote a TASK-layer memory (temporary, with expiration) to RAW-layer (permanent, no expiration). Use when a memory originally stored as temporary context proves to be persistently relevant and should be kept indefinitely.',
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: { type: 'string', description: 'ID of the memory to promote' },
    },
    required: ['memory_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.promote({ id: args['memory_id'] as string });
  },
};

export const submitFeedbackTool: ToolDefinition = {
  name: 'submit_feedback',
  description:
    'Submit quality feedback on a memory. Use POSITIVE when a memory proved accurate and useful. Use NEGATIVE when a memory was wrong, misleading, or irrelevant. Use NEUTRAL for neutral observations. This improves memory quality over time.',
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: { type: 'string', description: 'ID of the memory to submit feedback for' },
      signal: {
        type: 'string',
        enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
        description: 'Feedback signal indicating memory quality',
      },
      comment: { type: 'string', description: 'Optional comment explaining the feedback' },
    },
    required: ['memory_id', 'signal'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.feedback({
      id: args['memory_id'] as string,
      signal: args['signal'] as FeedbackSignal,
      ...(args['comment'] !== undefined && { comment: args['comment'] as string }),
    });
  },
};

export const getMemoryHistoryTool: ToolDefinition = {
  name: 'get_memory_history',
  description:
    'Get the event history of a memory — creation, updates, promotions, and feedback. Use when you need to understand how a memory evolved or diagnose unexpected behavior.',
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: { type: 'string', description: 'ID of the memory to retrieve history for' },
      limit: { type: 'string', description: 'Maximum number of events to return (default 20)' },
    },
    required: ['memory_id'],
  },
  handler: async (args: Record<string, unknown>, client: MemsolusClient) => {
    return client.memories.history({
      id: args['memory_id'] as string,
      ...(args['limit'] !== undefined && { limit: Number(args['limit']) }),
    });
  },
};
