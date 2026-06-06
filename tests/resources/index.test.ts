import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemsolusClient } from '@memsolus/sdk';
import {
  workspaceSummaryResource,
  knowledgeMergedResource,
  memoryByIdResource,
  entitiesResource,
  allResources,
} from '_resources/index';

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

describe('workspace summary resource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct URI', () => {
    expect(workspaceSummaryResource.uri).toBe('memsolus://workspace/summary');
  });

  it('should have correct mimeType', () => {
    expect(workspaceSummaryResource.mimeType).toBe('application/json');
  });

  it('should have non-empty name and description', () => {
    expect(workspaceSummaryResource.name.length).toBeGreaterThan(0);
    expect(workspaceSummaryResource.description.length).toBeGreaterThan(0);
  });

  it('should call client.dashboard.summary and return JSON string', async () => {
    const mockSummary = {
      totalMemories: 42,
      totalSearches: 100,
      totalTokens: 5000,
      comparisonPeriod: { memories: 30, searches: 80, tokens: 4000 },
      days: 30,
    };
    vi.mocked(mockClient.dashboard.summary).mockResolvedValue(mockSummary as never);

    const result = await workspaceSummaryResource.handler(mockClient);

    expect(mockClient.dashboard.summary).toHaveBeenCalled();
    expect(JSON.parse(result)).toEqual(mockSummary);
  });
});

describe('knowledge merged resource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct URI', () => {
    expect(knowledgeMergedResource.uri).toBe('memsolus://knowledge/merged');
  });

  it('should have correct mimeType', () => {
    expect(knowledgeMergedResource.mimeType).toBe('application/json');
  });

  it('should have non-empty name and description', () => {
    expect(knowledgeMergedResource.name.length).toBeGreaterThan(0);
    expect(knowledgeMergedResource.description.length).toBeGreaterThan(0);
  });

  it('should call client.knowledge.list with merged true and return JSON string', async () => {
    const mockMerged = {
      userId: undefined,
      entries: [
        { id: 'k1', content: '# User Preferences\nLikes TypeScript', category: 'preferences', sourceMemoryIds: [], createdAt: '2024-01-01' },
      ],
      mergedAt: '2024-01-01',
    };
    vi.mocked(mockClient.knowledge.list).mockResolvedValue(mockMerged as never);

    const result = await knowledgeMergedResource.handler(mockClient);

    expect(mockClient.knowledge.list).toHaveBeenCalledWith({ merged: true });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(JSON.parse(result)).toEqual(mockMerged);
  });
});

describe('memory by id resource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct URI pattern', () => {
    expect(memoryByIdResource.uri).toBe('memsolus://memory/{id}');
  });

  it('should have correct mimeType', () => {
    expect(memoryByIdResource.mimeType).toBe('application/json');
  });

  it('should have non-empty name and description', () => {
    expect(memoryByIdResource.name.length).toBeGreaterThan(0);
    expect(memoryByIdResource.description.length).toBeGreaterThan(0);
  });

  it('should call client.memories.get with id from params and return JSON string', async () => {
    const mockMemory = {
      id: 'mem_123',
      content: 'Test memory',
      layer: 'RAW',
      priority: 'MEDIUM',
      status: 'READY',
      categories: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    vi.mocked(mockClient.memories.get).mockResolvedValue(mockMemory as never);

    const result = await memoryByIdResource.handler(mockClient, { id: 'mem_123' });

    expect(mockClient.memories.get).toHaveBeenCalledWith({ id: 'mem_123' });
    expect(JSON.parse(result)).toEqual(mockMemory);
  });

  it('should throw error when id param is missing', async () => {
    await expect(memoryByIdResource.handler(mockClient)).rejects.toThrow('memory id is required');
    await expect(memoryByIdResource.handler(mockClient, {})).rejects.toThrow('memory id is required');
  });
});

describe('entities resource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct URI', () => {
    expect(entitiesResource.uri).toBe('memsolus://entities');
  });

  it('should have correct mimeType', () => {
    expect(entitiesResource.mimeType).toBe('application/json');
  });

  it('should have non-empty name and description', () => {
    expect(entitiesResource.name.length).toBeGreaterThan(0);
    expect(entitiesResource.description.length).toBeGreaterThan(0);
  });

  it('should call client.entities.list and return JSON string', async () => {
    const mockEntities = [
      { userId: 'user_abc', memoryCount: 10, lastActivityAt: '2024-01-01' },
    ];
    vi.mocked(mockClient.entities.list).mockResolvedValue(mockEntities as never);

    const result = await entitiesResource.handler(mockClient);

    expect(mockClient.entities.list).toHaveBeenCalled();
    expect(JSON.parse(result)).toEqual(mockEntities);
  });
});

describe('allResources', () => {
  it('should contain exactly 4 resources', () => {
    expect(allResources.length).toBe(4);
  });

  it('should contain all expected URIs', () => {
    const uris = allResources.map((r) => r.uri);
    expect(uris).toContain('memsolus://workspace/summary');
    expect(uris).toContain('memsolus://knowledge/merged');
    expect(uris).toContain('memsolus://memory/{id}');
    expect(uris).toContain('memsolus://entities');
  });
});
