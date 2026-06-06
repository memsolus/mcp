import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemsolusClient } from '@memsolus/sdk';
import {
  getDashboardSummaryTool,
  getMemoryProfileTool,
  listEntitiesTool,
} from '_tools/utilities';

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

describe('get_dashboard_summary tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(getDashboardSummaryTool.name).toBe('get_dashboard_summary');
  });

  it('should have non-empty description', () => {
    expect(getDashboardSummaryTool.description.length).toBeGreaterThan(0);
  });

  it('should have valid inputSchema with type object', () => {
    expect(getDashboardSummaryTool.inputSchema.type).toBe('object');
    expect(getDashboardSummaryTool.inputSchema.properties).toBeDefined();
  });

  it('should call client.dashboard.summary without params by default', async () => {
    const mockResult = {
      totalMemories: 42,
      totalSearches: 100,
      totalTokens: 5000,
      comparisonPeriod: { memories: 30, searches: 80, tokens: 4000 },
      days: 30,
    };
    vi.mocked(mockClient.dashboard.summary).mockResolvedValue(mockResult as never);

    const result = await getDashboardSummaryTool.handler({}, mockClient);

    expect(mockClient.dashboard.summary).toHaveBeenCalledWith({});
    expect(result).toEqual(mockResult);
  });

  it('should forward days when provided', async () => {
    vi.mocked(mockClient.dashboard.summary).mockResolvedValue({} as never);

    await getDashboardSummaryTool.handler({ days: '7' }, mockClient);

    expect(mockClient.dashboard.summary).toHaveBeenCalledWith({ days: 7 });
  });
});

describe('get_memory_profile tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(getMemoryProfileTool.name).toBe('get_memory_profile');
  });

  it('should have non-empty description', () => {
    expect(getMemoryProfileTool.description.length).toBeGreaterThan(0);
  });

  it('should require "user_id" parameter', () => {
    const required = getMemoryProfileTool.inputSchema.required as string[];
    expect(required).toContain('user_id');
  });

  it('should call client.profiles.get with correct params', async () => {
    const mockResult = {
      userId: 'user_abc',
      summary: 'A software developer interested in TypeScript',
      topics: ['TypeScript', 'NestJS'],
      entityCount: 5,
    };
    vi.mocked(mockClient.profiles.get).mockResolvedValue(mockResult as never);

    const result = await getMemoryProfileTool.handler({ user_id: 'user_abc' }, mockClient);

    expect(mockClient.profiles.get).toHaveBeenCalledWith({ userId: 'user_abc' });
    expect(result).toEqual(mockResult);
  });
});

describe('list_entities tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(listEntitiesTool.name).toBe('list_entities');
  });

  it('should have non-empty description', () => {
    expect(listEntitiesTool.description.length).toBeGreaterThan(0);
  });

  it('should have valid inputSchema with no required parameters', () => {
    expect(listEntitiesTool.inputSchema.type).toBe('object');
    const required = listEntitiesTool.inputSchema.required as string[];
    expect(required.length).toBe(0);
  });

  it('should call client.entities.list without params', async () => {
    const mockResult = [
      { userId: 'user_abc', memoryCount: 10, lastActivityAt: '2024-01-01' },
    ];
    vi.mocked(mockClient.entities.list).mockResolvedValue(mockResult as never);

    const result = await listEntitiesTool.handler({}, mockClient);

    expect(mockClient.entities.list).toHaveBeenCalledWith();
    expect(result).toEqual(mockResult);
  });
});
