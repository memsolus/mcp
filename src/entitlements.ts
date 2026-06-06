import type { ToolDefinition } from '_tools/index';
import type { ResourceDefinition } from '_resources/index';
import type { PromptDefinition } from '_prompts/index';

const KNOWLEDGE_GRAPH_TOOLS = new Set([
  'graph_search',
  'graph_traverse',
  'graph_query',
  'get_knowledge',
  'get_knowledge_entry',
]);

const KNOWLEDGE_GRAPH_RESOURCES = new Set([
  'memsolus://knowledge/merged',
]);

export interface McpEntitlements {
  readonly hasKnowledgeGraph: boolean;
  readonly hasMcpAccess: boolean;
}

export interface FilteredCapabilities {
  readonly tools: readonly ToolDefinition[];
  readonly resources: readonly ResourceDefinition[];
  readonly prompts: readonly PromptDefinition[];
  readonly disabledFeatures: readonly string[];
}

export function filterByEntitlements(
  tools: readonly ToolDefinition[],
  resources: readonly ResourceDefinition[],
  prompts: readonly PromptDefinition[],
  entitlements: McpEntitlements,
): FilteredCapabilities {
  if (!entitlements.hasMcpAccess) {
    return {
      tools: [],
      resources: [],
      prompts: [],
      disabledFeatures: ['MCP Access (requires paid plan)'],
    };
  }

  const disabledFeatures: string[] = [];
  let filteredTools = [...tools];
  let filteredResources = [...resources];

  if (!entitlements.hasKnowledgeGraph) {
    filteredTools = filteredTools.filter((t) => !KNOWLEDGE_GRAPH_TOOLS.has(t.name));
    filteredResources = filteredResources.filter((r) => !KNOWLEDGE_GRAPH_RESOURCES.has(r.uri));
    disabledFeatures.push('Knowledge Graph (requires Pro plan or above)');
  }

  // Prompts ficam disponíveis mesmo sem KG — os handlers lidam com falhas graciosamente
  return {
    tools: filteredTools,
    resources: filteredResources,
    prompts: [...prompts],
    disabledFeatures,
  };
}
