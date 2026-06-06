import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemsolusClient } from '@memsolus/sdk';
import { graphSearchTool, graphTraverseTool, graphQueryTool } from '_tools/graph';

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

describe('graph_search tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(graphSearchTool.name).toBe('graph_search');
  });

  it('should have non-empty description', () => {
    expect(graphSearchTool.description.length).toBeGreaterThan(0);
  });

  it('should require "query" parameter', () => {
    const required = graphSearchTool.inputSchema.required as string[];
    expect(required).toContain('query');
  });

  it('should have valid inputSchema with type object', () => {
    expect(graphSearchTool.inputSchema.type).toBe('object');
    expect(graphSearchTool.inputSchema.properties).toBeDefined();
  });

  it('should call client.graph.search with correct params', async () => {
    const mockResult = [
      { id: 'ent_123', name: 'João', type: 'PERSON', description: undefined },
    ];
    vi.mocked(mockClient.graph.search).mockResolvedValue(mockResult as never);

    const result = await graphSearchTool.handler({ query: 'João' }, mockClient);

    expect(mockClient.graph.search).toHaveBeenCalledWith({ query: 'João' });
    expect(result).toEqual(mockResult);
  });

  it('should forward type filter when provided', async () => {
    vi.mocked(mockClient.graph.search).mockResolvedValue([] as never);

    await graphSearchTool.handler({ query: 'Acme', type: 'ORGANIZATION' }, mockClient);

    expect(mockClient.graph.search).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ORGANIZATION' }),
    );
  });

  it('should forward limit when provided', async () => {
    vi.mocked(mockClient.graph.search).mockResolvedValue([] as never);

    await graphSearchTool.handler({ query: 'test', limit: '5' }, mockClient);

    expect(mockClient.graph.search).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 }),
    );
  });
});

describe('graph_traverse tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(graphTraverseTool.name).toBe('graph_traverse');
  });

  it('should have non-empty description', () => {
    expect(graphTraverseTool.description.length).toBeGreaterThan(0);
  });

  it('should require "entity_id" parameter', () => {
    const required = graphTraverseTool.inputSchema.required as string[];
    expect(required).toContain('entity_id');
  });

  it('should call client.graph.traverse with correct params', async () => {
    const mockResult = {
      startEntity: { id: 'ent_123', name: 'João', type: 'PERSON' },
      paths: [],
    };
    vi.mocked(mockClient.graph.traverse).mockResolvedValue(mockResult as never);

    const result = await graphTraverseTool.handler({ entity_id: 'ent_123' }, mockClient);

    expect(mockClient.graph.traverse).toHaveBeenCalledWith({ entityId: 'ent_123' });
    expect(result).toEqual(mockResult);
  });

  it('should forward direction when provided', async () => {
    vi.mocked(mockClient.graph.traverse).mockResolvedValue({ startEntity: {}, paths: [] } as never);

    await graphTraverseTool.handler({ entity_id: 'ent_123', direction: 'outgoing' }, mockClient);

    expect(mockClient.graph.traverse).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'outbound' }),
    );
  });

  it('should forward hops when provided', async () => {
    vi.mocked(mockClient.graph.traverse).mockResolvedValue({ startEntity: {}, paths: [] } as never);

    await graphTraverseTool.handler({ entity_id: 'ent_123', hops: '3' }, mockClient);

    expect(mockClient.graph.traverse).toHaveBeenCalledWith(
      expect.objectContaining({ hops: 3 }),
    );
  });
});

describe('graph_query tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(graphQueryTool.name).toBe('graph_query');
  });

  it('should have non-empty description', () => {
    expect(graphQueryTool.description.length).toBeGreaterThan(0);
  });

  it('should require "question" parameter', () => {
    const required = graphQueryTool.inputSchema.required as string[];
    expect(required).toContain('question');
  });

  it('should call client.graph.query with correct params', async () => {
    const mockResult = {
      answer: 'João works at Acme Corp.',
      entitiesUsed: [],
      confidence: 0.95,
    };
    vi.mocked(mockClient.graph.query).mockResolvedValue(mockResult as never);

    const result = await graphQueryTool.handler(
      { question: 'Where does João work?' },
      mockClient,
    );

    expect(mockClient.graph.query).toHaveBeenCalledWith({ question: 'Where does João work?' });
    expect(result).toEqual(mockResult);
  });
});
