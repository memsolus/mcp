import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemsolusClient } from '@memsolus/sdk';
import {
  addMemoryTool,
  searchMemoriesTool,
  getMemoriesTool,
  getMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  promoteMemoryTool,
  submitFeedbackTool,
  getMemoryHistoryTool,
} from '_tools/memory';

const mockClient = {
  memories: {
    create: vi.fn(),
    search: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    promote: vi.fn(),
    feedback: vi.fn(),
    history: vi.fn(),
  },
  knowledge: { list: vi.fn(), get: vi.fn() },
  graph: { search: vi.fn(), traverse: vi.fn(), query: vi.fn() },
  dashboard: { summary: vi.fn() },
  profiles: { get: vi.fn() },
  categories: { list: vi.fn() },
  entities: { list: vi.fn() },
} as unknown as MemsolusClient;

describe('add_memory tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(addMemoryTool.name).toBe('add_memory');
  });

  it('should have non-empty description', () => {
    expect(addMemoryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "memory" parameter', () => {
    const required = addMemoryTool.inputSchema.required as string[];
    expect(required).toContain('memory');
  });

  it('should have valid inputSchema with type object', () => {
    expect(addMemoryTool.inputSchema.type).toBe('object');
    expect(addMemoryTool.inputSchema.properties).toBeDefined();
  });

  it('should call client.memories.create with correct params', async () => {
    const mockResult = { id: 'mem_123', content: 'test fact', status: 'PENDING' };
    vi.mocked(mockClient.memories.create).mockResolvedValue(mockResult as never);

    const result = await addMemoryTool.handler({ memory: 'test fact' }, mockClient);

    expect(mockClient.memories.create).toHaveBeenCalledWith({ content: 'test fact' });
    expect(result).toEqual(mockResult);
  });

  it('should forward priority when provided', async () => {
    const mockResult = { id: 'mem_456', content: 'important fact', status: 'PENDING' };
    vi.mocked(mockClient.memories.create).mockResolvedValue(mockResult as never);

    await addMemoryTool.handler({ memory: 'important fact', priority: 'HIGH' }, mockClient);

    expect(mockClient.memories.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'HIGH' }),
    );
  });

  it('should forward user_id when provided', async () => {
    vi.mocked(mockClient.memories.create).mockResolvedValue({} as never);

    await addMemoryTool.handler({ memory: 'fact', user_id: 'user_abc' }, mockClient);

    expect(mockClient.memories.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_abc' }),
    );
  });

  it('should parse valid metadata JSON and forward it', async () => {
    vi.mocked(mockClient.memories.create).mockResolvedValue({} as never);

    await addMemoryTool.handler(
      { memory: 'fact', metadata: '{"source":"test","version":1}' },
      mockClient,
    );

    expect(mockClient.memories.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { source: 'test', version: 1 } }),
    );
  });

  it('should throw error when metadata is invalid JSON', async () => {
    await expect(
      addMemoryTool.handler({ memory: 'fact', metadata: 'not-valid-json' }, mockClient),
    ).rejects.toThrow('metadata must be valid JSON string');
  });
});

describe('search_memories tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(searchMemoriesTool.name).toBe('search_memories');
  });

  it('should have non-empty description', () => {
    expect(searchMemoriesTool.description.length).toBeGreaterThan(0);
  });

  it('should require "query" parameter', () => {
    const required = searchMemoriesTool.inputSchema.required as string[];
    expect(required).toContain('query');
  });

  it('should call client.memories.search with correct params', async () => {
    const mockResult = { data: [], meta: { total: 0, mode: 'hybrid' } };
    vi.mocked(mockClient.memories.search).mockResolvedValue(mockResult as never);

    const result = await searchMemoriesTool.handler({ query: 'test query' }, mockClient);

    expect(mockClient.memories.search).toHaveBeenCalledWith({ query: 'test query' });
    expect(result).toEqual(mockResult);
  });

  it('should forward mode when provided', async () => {
    vi.mocked(mockClient.memories.search).mockResolvedValue({ data: [], meta: { total: 0, mode: 'keyword' } } as never);

    await searchMemoriesTool.handler({ query: 'test', mode: 'keyword' }, mockClient);

    expect(mockClient.memories.search).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'keyword' }),
    );
  });
});

describe('get_memories tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(getMemoriesTool.name).toBe('get_memories');
  });

  it('should have non-empty description', () => {
    expect(getMemoriesTool.description.length).toBeGreaterThan(0);
  });

  it('should have valid inputSchema with type object', () => {
    expect(getMemoriesTool.inputSchema.type).toBe('object');
  });

  it('should call client.memories.list with correct params', async () => {
    const mockResult = { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } };
    vi.mocked(mockClient.memories.list).mockResolvedValue(mockResult as never);

    const result = await getMemoriesTool.handler({ user_id: 'user_abc' }, mockClient);

    expect(mockClient.memories.list).toHaveBeenCalledWith({ userId: 'user_abc' });
    expect(result).toEqual(mockResult);
  });

  it('should forward page and limit when provided', async () => {
    vi.mocked(mockClient.memories.list).mockResolvedValue({ data: [], meta: { total: 0, page: 2, pageSize: 10, totalPages: 0 } } as never);

    await getMemoriesTool.handler({ page: '2', limit: '10' }, mockClient);

    expect(mockClient.memories.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });
});

describe('get_memory tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(getMemoryTool.name).toBe('get_memory');
  });

  it('should have non-empty description', () => {
    expect(getMemoryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "memory_id" parameter', () => {
    const required = getMemoryTool.inputSchema.required as string[];
    expect(required).toContain('memory_id');
  });

  it('should call client.memories.get with correct params', async () => {
    const mockResult = { id: 'mem_123', content: 'fact', status: 'READY' };
    vi.mocked(mockClient.memories.get).mockResolvedValue(mockResult as never);

    const result = await getMemoryTool.handler({ memory_id: 'mem_123' }, mockClient);

    expect(mockClient.memories.get).toHaveBeenCalledWith({ id: 'mem_123' });
    expect(result).toEqual(mockResult);
  });
});

describe('update_memory tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(updateMemoryTool.name).toBe('update_memory');
  });

  it('should have non-empty description', () => {
    expect(updateMemoryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "memory_id" parameter', () => {
    const required = updateMemoryTool.inputSchema.required as string[];
    expect(required).toContain('memory_id');
  });

  it('should call client.memories.update with correct params', async () => {
    const mockResult = { id: 'mem_123', content: 'updated fact', status: 'READY' };
    vi.mocked(mockClient.memories.update).mockResolvedValue(mockResult as never);

    const result = await updateMemoryTool.handler(
      { memory_id: 'mem_123', memory: 'updated fact' },
      mockClient,
    );

    expect(mockClient.memories.update).toHaveBeenCalledWith({
      id: 'mem_123',
      content: 'updated fact',
    });
    expect(result).toEqual(mockResult);
  });

  it('should forward priority when provided', async () => {
    vi.mocked(mockClient.memories.update).mockResolvedValue({} as never);

    await updateMemoryTool.handler({ memory_id: 'mem_123', priority: 'HIGH' }, mockClient);

    expect(mockClient.memories.update).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'HIGH' }),
    );
  });
});

describe('delete_memory tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(deleteMemoryTool.name).toBe('delete_memory');
  });

  it('should have non-empty description', () => {
    expect(deleteMemoryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "memory_id" parameter', () => {
    const required = deleteMemoryTool.inputSchema.required as string[];
    expect(required).toContain('memory_id');
  });

  it('should call client.memories.delete with correct params', async () => {
    vi.mocked(mockClient.memories.delete).mockResolvedValue(undefined);

    await deleteMemoryTool.handler({ memory_id: 'mem_123' }, mockClient);

    expect(mockClient.memories.delete).toHaveBeenCalledWith({ id: 'mem_123' });
  });
});

describe('promote_memory tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(promoteMemoryTool.name).toBe('promote_memory');
  });

  it('should have non-empty description', () => {
    expect(promoteMemoryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "memory_id" parameter', () => {
    const required = promoteMemoryTool.inputSchema.required as string[];
    expect(required).toContain('memory_id');
  });

  it('should call client.memories.promote with correct params', async () => {
    vi.mocked(mockClient.memories.promote).mockResolvedValue(undefined);

    await promoteMemoryTool.handler({ memory_id: 'mem_123' }, mockClient);

    expect(mockClient.memories.promote).toHaveBeenCalledWith({ id: 'mem_123' });
  });
});

describe('submit_feedback tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(submitFeedbackTool.name).toBe('submit_feedback');
  });

  it('should have non-empty description', () => {
    expect(submitFeedbackTool.description.length).toBeGreaterThan(0);
  });

  it('should require "memory_id" and "signal" parameters', () => {
    const required = submitFeedbackTool.inputSchema.required as string[];
    expect(required).toContain('memory_id');
    expect(required).toContain('signal');
  });

  it('should call client.memories.feedback with correct params', async () => {
    vi.mocked(mockClient.memories.feedback).mockResolvedValue(undefined);

    await submitFeedbackTool.handler(
      { memory_id: 'mem_123', signal: 'POSITIVE' },
      mockClient,
    );

    expect(mockClient.memories.feedback).toHaveBeenCalledWith({
      id: 'mem_123',
      signal: 'POSITIVE',
    });
  });

  it('should forward comment when provided', async () => {
    vi.mocked(mockClient.memories.feedback).mockResolvedValue(undefined);

    await submitFeedbackTool.handler(
      { memory_id: 'mem_123', signal: 'NEGATIVE', comment: 'Wrong info' },
      mockClient,
    );

    expect(mockClient.memories.feedback).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'Wrong info' }),
    );
  });
});

describe('get_memory_history tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(getMemoryHistoryTool.name).toBe('get_memory_history');
  });

  it('should have non-empty description', () => {
    expect(getMemoryHistoryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "memory_id" parameter', () => {
    const required = getMemoryHistoryTool.inputSchema.required as string[];
    expect(required).toContain('memory_id');
  });

  it('should call client.memories.history with correct params', async () => {
    const mockResult = { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } };
    vi.mocked(mockClient.memories.history).mockResolvedValue(mockResult as never);

    const result = await getMemoryHistoryTool.handler({ memory_id: 'mem_123' }, mockClient);

    expect(mockClient.memories.history).toHaveBeenCalledWith({ id: 'mem_123' });
    expect(result).toEqual(mockResult);
  });

  it('should forward limit when provided', async () => {
    vi.mocked(mockClient.memories.history).mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 10, totalPages: 0 } } as never);

    await getMemoryHistoryTool.handler({ memory_id: 'mem_123', limit: '10' }, mockClient);

    expect(mockClient.memories.history).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 }),
    );
  });
});
