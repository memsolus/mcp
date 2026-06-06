import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MemsolusClient } from '@memsolus/sdk';
import type { McpConfig } from '_config';
import type { ToolDefinition } from '_tools/index';
import { allTools } from '_tools/index';
import type { ResourceDefinition } from '_resources/index';
import { allResources } from '_resources/index';
import type { PromptDefinition } from '_prompts/index';
import { allPrompts } from '_prompts/index';
import { filterByEntitlements } from './entitlements.js';
import type { McpEntitlements } from './entitlements.js';

export interface ServerInstance {
  readonly server: Server;
  readonly transport: StdioServerTransport;
}

// Permissivo por padrão — a API rejeita chamadas indevidas com 403
const FALLBACK_ENTITLEMENTS: McpEntitlements = {
  hasMcpAccess: true,
  hasKnowledgeGraph: true,
};

export async function createServer(config: McpConfig): Promise<ServerInstance> {
  const client = buildClient(config);

  const entitlements = await fetchEntitlements(client);
  const filtered = filterByEntitlements(allTools, allResources, allPrompts, entitlements);

  if (!entitlements.hasMcpAccess) {
    process.stderr.write(
      '[memsolus-mcp] Error: Your plan does not include MCP access. Upgrade at app.memsolus.com/settings/billing\n',
    );
  }

  if (filtered.disabledFeatures.length > 0) {
    process.stderr.write(
      `[memsolus-mcp] Disabled features: ${filtered.disabledFeatures.join(', ')}\n`,
    );
  }

  const server = buildServer();
  registerToolHandlers(server, client, filtered.tools);
  registerResourceHandlers(server, client, filtered.resources);
  registerPromptHandlers(server, client, filtered.prompts);

  const transport = new StdioServerTransport();

  return { server, transport };
}

function buildClient(config: McpConfig): MemsolusClient {
  const clientConfig: { apiKey: string; baseUrl?: string; workspaceId?: string } = {
    apiKey: config.apiKey,
    baseUrl: config.apiUrl,
  };

  if (config.workspaceId !== undefined) {
    clientConfig.workspaceId = config.workspaceId;
  }

  return new MemsolusClient(clientConfig);
}

async function fetchEntitlements(client: MemsolusClient): Promise<McpEntitlements> {
  try {
    const profile = await client.accessProfile.get();
    return {
      hasMcpAccess: profile.plan.entitlements.hasMcpAccess,
      hasKnowledgeGraph: profile.plan.entitlements.hasKnowledgeGraph,
    };
  } catch {
    // Fallback gracioso: registra todos os tools se a API estiver indisponível
    process.stderr.write(
      '[memsolus-mcp] Warning: Could not fetch plan entitlements. Registering all tools.\n',
    );
    return FALLBACK_ENTITLEMENTS;
  }
}

function buildServer(): Server {
  return new Server(
    { name: 'memsolus', version: '1.0.0' },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );
}

function registerToolHandlers(
  server: Server,
  client: MemsolusClient,
  tools: readonly ToolDefinition[],
): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: 'text' as const, text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }

    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    try {
      const result = await tool.handler(args, client);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      };
    } catch (error) {
      return buildToolErrorResult(error);
    }
  });
}

function buildToolErrorResult(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
  }

  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  };
}

function registerResourceHandlers(
  server: Server,
  client: MemsolusClient,
  resources: readonly ResourceDefinition[],
): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const requestUri = request.params.uri;
    const resource = findResourceByUri(requestUri, resources);

    if (!resource) {
      throw new Error(`Resource not found: ${requestUri}`);
    }

    const params = extractUriParams(resource.uri, requestUri);
    const content = await resource.handler(client, params);

    return {
      contents: [
        {
          uri: requestUri,
          mimeType: resource.mimeType,
          text: content,
        },
      ],
    };
  });
}

function registerPromptHandlers(
  server: Server,
  client: MemsolusClient,
  prompts: readonly PromptDefinition[],
): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments.map((arg) => ({
          name: arg.name,
          description: arg.description,
          required: arg.required,
        })),
      })),
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = prompts.find((p) => p.name === request.params.name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${request.params.name}`);
    }

    const args = (request.params.arguments ?? {}) as Record<string, string>;
    const text = await prompt.handler(args, client);

    return {
      description: prompt.description,
      messages: [
        {
          role: 'user' as const,
          content: { type: 'text' as const, text },
        },
      ],
    };
  });
}

function findResourceByUri(
  requestUri: string,
  resources: readonly ResourceDefinition[],
): ResourceDefinition | undefined {
  for (const resource of resources) {
    if (isUriMatch(resource.uri, requestUri)) {
      return resource;
    }
  }
  return undefined;
}

function isUriMatch(template: string, uri: string): boolean {
  const pattern = template.replace(/\{[^}]+\}/g, '[^/]+');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(uri);
}

function extractUriParams(template: string, uri: string): Record<string, string> {
  const paramNames: string[] = [];
  const paramPattern = /\{([^}]+)\}/g;
  let match = paramPattern.exec(template);

  while (match !== null) {
    if (match[1] !== undefined) {
      paramNames.push(match[1]);
    }
    match = paramPattern.exec(template);
  }

  if (paramNames.length === 0) {
    return {};
  }

  const regexSource = template.replace(/\{[^}]+\}/g, '([^/]+)');
  const regex = new RegExp(`^${regexSource}$`);
  const valueMatch = regex.exec(uri);

  if (!valueMatch) {
    return {};
  }

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    const value = valueMatch[index + 1];
    if (value !== undefined) {
      params[name] = value;
    }
  });

  return params;
}
