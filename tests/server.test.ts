import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { McpConfig } from '_config';

const mockAccessProfileGet = vi.fn();

vi.mock('@memsolus/sdk', () => {
  const MemsolusError = class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'MemsolusError';
    }
  };

  const MemsolusClient = vi.fn().mockImplementation(() => ({
    accessProfile: {
      get: mockAccessProfileGet,
    },
  }));

  return { MemsolusClient, MemsolusError };
});

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  const Server = vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
  }));
  return { Server };
});

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  const StdioServerTransport = vi.fn().mockImplementation(() => ({}));
  return { StdioServerTransport };
});

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: {},
  CallToolRequestSchema: {},
  ListResourcesRequestSchema: {},
  ReadResourceRequestSchema: {},
  ListPromptsRequestSchema: {},
  GetPromptRequestSchema: {},
}));

function makeFullAccessProfile() {
  return {
    plan: {
      id: 'plan_pro',
      tier: 'pro',
      name: 'Pro',
      limits: {
        maxMemories: 10000,
        maxRequestsMonth: 100000,
        maxOutputTokens: null,
        maxFileSizeMb: 50,
        maxIngestsPerDay: 100,
        maxWorkspaceMembers: 10,
      },
      entitlements: {
        hasKnowledgeGraph: true,
        hasWebhooks: true,
        hasMemoryPools: true,
        hasTemplates: true,
        hasAdvancedAudit: true,
        hasIngest: true,
        hasMcpAccess: true,
      },
    },
    access: {
      isOwner: true,
      permissions: ['read', 'write'],
    },
  };
}

const BASE_CONFIG: McpConfig = {
  apiKey: 'test-api-key',
  apiUrl: 'https://api.memsolus.com',
};

describe('createServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessProfileGet.mockResolvedValue(makeFullAccessProfile());
  });

  it('should return server and transport without throwing', async () => {
    const result = await createServer(BASE_CONFIG);

    expect(result).toBeDefined();
    expect(result.server).toBeDefined();
    expect(result.transport).toBeDefined();
  });

  it('should return server and transport when workspaceId is provided', async () => {
    const config: McpConfig = {
      ...BASE_CONFIG,
      workspaceId: 'ws_123',
    };

    const result = await createServer(config);

    expect(result).toBeDefined();
    expect(result.server).toBeDefined();
    expect(result.transport).toBeDefined();
  });

  it('should register request handlers on the server', async () => {
    const { server } = await createServer(BASE_CONFIG);
    const setRequestHandler = server.setRequestHandler as ReturnType<typeof vi.fn>;

    expect(setRequestHandler).toHaveBeenCalled();
    expect(setRequestHandler.mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  it('should call accessProfile.get() during startup', async () => {
    await createServer(BASE_CONFIG);

    expect(mockAccessProfileGet).toHaveBeenCalledOnce();
  });

  it('should fall back to all tools when accessProfile.get() throws', async () => {
    mockAccessProfileGet.mockRejectedValue(new Error('Network error'));

    // Deve completar sem lançar — fallback gracioso
    const result = await createServer(BASE_CONFIG);

    expect(result.server).toBeDefined();
    expect(result.transport).toBeDefined();
  });

  it('should complete successfully when KG is disabled in entitlements', async () => {
    const profileWithoutKg = makeFullAccessProfile();
    profileWithoutKg.plan.entitlements.hasKnowledgeGraph = false;
    mockAccessProfileGet.mockResolvedValue(profileWithoutKg);

    const result = await createServer(BASE_CONFIG);

    expect(result.server).toBeDefined();
    expect(result.transport).toBeDefined();
  });

  it('should complete successfully when hasMcpAccess is false', async () => {
    const profileWithoutMcp = makeFullAccessProfile();
    profileWithoutMcp.plan.entitlements.hasMcpAccess = false;
    mockAccessProfileGet.mockResolvedValue(profileWithoutMcp);

    const result = await createServer(BASE_CONFIG);

    expect(result.server).toBeDefined();
    expect(result.transport).toBeDefined();
  });
});
