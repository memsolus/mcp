import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemsolusClient } from '@memsolus/sdk';
import {
  recallContextPrompt,
  sessionHandoffPrompt,
  decisionLogPrompt,
  allPrompts,
} from '_prompts/index';

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

describe('recall-context prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(recallContextPrompt.name).toBe('recall-context');
  });

  it('should have non-empty description', () => {
    expect(recallContextPrompt.description.length).toBeGreaterThan(0);
  });

  it('should define "topic" as a required argument', () => {
    const topicArg = recallContextPrompt.arguments.find((a) => a.name === 'topic');
    expect(topicArg).toBeDefined();
    expect(topicArg?.required).toBe(true);
  });

  it('should call search_memories with topic and get_knowledge with merged true', async () => {
    vi.mocked(mockClient.memories.search).mockResolvedValue({
      data: [{ id: 'mem_1', content: 'Relevant memory' }],
      meta: { total: 1, mode: 'hybrid' },
    } as never);
    vi.mocked(mockClient.knowledge.list).mockResolvedValue({
      entries: [],
      mergedAt: '2024-01-01',
    } as never);

    const result = await recallContextPrompt.handler({ topic: 'TypeScript' }, mockClient);

    expect(mockClient.memories.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'TypeScript' }),
    );
    expect(mockClient.knowledge.list).toHaveBeenCalledWith({ merged: true });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('session-handoff prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(sessionHandoffPrompt.name).toBe('session-handoff');
  });

  it('should have non-empty description', () => {
    expect(sessionHandoffPrompt.description.length).toBeGreaterThan(0);
  });

  it('should define "summary" as a required argument', () => {
    const summaryArg = sessionHandoffPrompt.arguments.find((a) => a.name === 'summary');
    expect(summaryArg).toBeDefined();
    expect(summaryArg?.required).toBe(true);
  });

  it('should call add_memory with HIGH priority', async () => {
    vi.mocked(mockClient.memories.create).mockResolvedValue({
      id: 'mem_new',
      content: 'Session summary',
      status: 'PENDING',
    } as never);

    await sessionHandoffPrompt.handler(
      { summary: 'Implemented the MCP server with TDD approach' },
      mockClient,
    );

    expect(mockClient.memories.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'HIGH' }),
    );
  });

  it('should include summary content in the memory', async () => {
    vi.mocked(mockClient.memories.create).mockResolvedValue({ id: 'mem_new' } as never);

    const summary = 'Implemented the MCP server with TDD approach';
    await sessionHandoffPrompt.handler({ summary }, mockClient);

    expect(mockClient.memories.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining(summary) }),
    );
  });
});

describe('decision-log prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(decisionLogPrompt.name).toBe('decision-log');
  });

  it('should have non-empty description', () => {
    expect(decisionLogPrompt.description.length).toBeGreaterThan(0);
  });

  it('should define "decision" as a required argument', () => {
    const decisionArg = decisionLogPrompt.arguments.find((a) => a.name === 'decision');
    expect(decisionArg).toBeDefined();
    expect(decisionArg?.required).toBe(true);
  });

  it('should define "alternatives" as an optional argument', () => {
    const alternativesArg = decisionLogPrompt.arguments.find((a) => a.name === 'alternatives');
    expect(alternativesArg).toBeDefined();
    expect(alternativesArg?.required).toBe(false);
  });

  it('should define "reason" as an optional argument', () => {
    const reasonArg = decisionLogPrompt.arguments.find((a) => a.name === 'reason');
    expect(reasonArg).toBeDefined();
    expect(reasonArg?.required).toBe(false);
  });

  it('should call add_memory with HIGH priority', async () => {
    vi.mocked(mockClient.memories.create).mockResolvedValue({ id: 'mem_new' } as never);

    await decisionLogPrompt.handler({ decision: 'Use TDD for MCP server' }, mockClient);

    expect(mockClient.memories.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'HIGH' }),
    );
  });

  it('should include decision in the memory content', async () => {
    vi.mocked(mockClient.memories.create).mockResolvedValue({ id: 'mem_new' } as never);

    const decision = 'Use TDD for MCP server';
    await decisionLogPrompt.handler({ decision }, mockClient);

    expect(mockClient.memories.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining(decision) }),
    );
  });

  it('should include alternatives and reason in memory when provided', async () => {
    vi.mocked(mockClient.memories.create).mockResolvedValue({ id: 'mem_new' } as never);

    await decisionLogPrompt.handler(
      {
        decision: 'Use TDD',
        alternatives: 'BDD, manual testing',
        reason: 'Ensures tests exist before implementation',
      },
      mockClient,
    );

    const callArgs = vi.mocked(mockClient.memories.create).mock.calls[0]?.[0];
    expect(callArgs?.content).toContain('BDD, manual testing');
    expect(callArgs?.content).toContain('Ensures tests exist before implementation');
  });
});

describe('allPrompts', () => {
  it('should contain exactly 3 prompts', () => {
    expect(allPrompts.length).toBe(3);
  });

  it('should contain all expected prompt names', () => {
    const names = allPrompts.map((p) => p.name);
    expect(names).toContain('recall-context');
    expect(names).toContain('session-handoff');
    expect(names).toContain('decision-log');
  });
});
