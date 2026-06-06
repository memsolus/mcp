import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemsolusClient } from '@memsolus/sdk';
import { getKnowledgeTool, getKnowledgeEntryTool } from '_tools/knowledge';

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

describe('get_knowledge tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(getKnowledgeTool.name).toBe('get_knowledge');
  });

  it('should have non-empty description', () => {
    expect(getKnowledgeTool.description.length).toBeGreaterThan(0);
  });

  it('should have valid inputSchema with type object', () => {
    expect(getKnowledgeTool.inputSchema.type).toBe('object');
    expect(getKnowledgeTool.inputSchema.properties).toBeDefined();
  });

  it('should call client.knowledge.list with merged true by default', async () => {
    const mockResult = { userId: undefined, entries: [], mergedAt: '2024-01-01' };
    vi.mocked(mockClient.knowledge.list).mockResolvedValue(mockResult as never);

    const result = await getKnowledgeTool.handler({}, mockClient);

    expect(mockClient.knowledge.list).toHaveBeenCalledWith({ merged: true });
    expect(result).toEqual(mockResult);
  });

  it('should forward user_id when provided', async () => {
    vi.mocked(mockClient.knowledge.list).mockResolvedValue({ entries: [], mergedAt: '2024-01-01' } as never);

    await getKnowledgeTool.handler({ user_id: 'user_abc' }, mockClient);

    expect(mockClient.knowledge.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_abc' }),
    );
  });

  it('should forward category when provided', async () => {
    vi.mocked(mockClient.knowledge.list).mockResolvedValue({ entries: [], mergedAt: '2024-01-01' } as never);

    await getKnowledgeTool.handler({ category: 'preferences' }, mockClient);

    expect(mockClient.knowledge.list).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'preferences' }),
    );
  });

  it('should set merged false when explicitly passed', async () => {
    const mockResult = { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } };
    vi.mocked(mockClient.knowledge.list).mockResolvedValue(mockResult as never);

    await getKnowledgeTool.handler({ merged: 'false' }, mockClient);

    expect(mockClient.knowledge.list).toHaveBeenCalledWith(
      expect.objectContaining({ merged: false }),
    );
  });
});

describe('get_knowledge_entry tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(getKnowledgeEntryTool.name).toBe('get_knowledge_entry');
  });

  it('should have non-empty description', () => {
    expect(getKnowledgeEntryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "knowledge_id" parameter', () => {
    const required = getKnowledgeEntryTool.inputSchema.required as string[];
    expect(required).toContain('knowledge_id');
  });

  it('should call client.knowledge.get with correct params', async () => {
    const mockResult = {
      id: 'know_123',
      content: 'User prefers TypeScript',
      category: 'preferences',
      sourceMemoryIds: [],
      createdAt: '2024-01-01',
    };
    vi.mocked(mockClient.knowledge.get).mockResolvedValue(mockResult as never);

    const result = await getKnowledgeEntryTool.handler({ knowledge_id: 'know_123' }, mockClient);

    expect(mockClient.knowledge.get).toHaveBeenCalledWith({ id: 'know_123' });
    expect(result).toEqual(mockResult);
  });
});
