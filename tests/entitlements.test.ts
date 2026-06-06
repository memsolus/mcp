import { describe, it, expect } from 'vitest';
import { filterByEntitlements } from '../src/entitlements.js';
import type { McpEntitlements, FilteredCapabilities } from '../src/entitlements.js';
import { allTools } from '../src/tools/index.js';
import { allResources } from '../src/resources/index.js';
import { allPrompts } from '../src/prompts/index.js';

const FULL_ENTITLEMENTS: McpEntitlements = {
  hasMcpAccess: true,
  hasKnowledgeGraph: true,
};

const NO_MCP_ENTITLEMENTS: McpEntitlements = {
  hasMcpAccess: false,
  hasKnowledgeGraph: true,
};

const NO_KG_ENTITLEMENTS: McpEntitlements = {
  hasMcpAccess: true,
  hasKnowledgeGraph: false,
};

const NO_ACCESS_NO_KG_ENTITLEMENTS: McpEntitlements = {
  hasMcpAccess: false,
  hasKnowledgeGraph: false,
};

const KNOWLEDGE_GRAPH_TOOL_NAMES = new Set([
  'graph_search',
  'graph_traverse',
  'graph_query',
  'get_knowledge',
  'get_knowledge_entry',
]);

const KNOWLEDGE_GRAPH_RESOURCE_URIS = new Set([
  'memsolus://knowledge/merged',
]);

describe('filterByEntitlements', () => {
  describe('with full entitlements', () => {
    it('returns all tools', () => {
      const result: FilteredCapabilities = filterByEntitlements(
        allTools,
        allResources,
        allPrompts,
        FULL_ENTITLEMENTS,
      );

      expect(result.tools).toHaveLength(allTools.length);
    });

    it('returns all resources', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, FULL_ENTITLEMENTS);

      expect(result.resources).toHaveLength(allResources.length);
    });

    it('returns all prompts', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, FULL_ENTITLEMENTS);

      expect(result.prompts).toHaveLength(allPrompts.length);
    });

    it('returns empty disabledFeatures', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, FULL_ENTITLEMENTS);

      expect(result.disabledFeatures).toHaveLength(0);
    });
  });

  describe('with hasMcpAccess false', () => {
    it('returns empty tools array', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_MCP_ENTITLEMENTS);

      expect(result.tools).toHaveLength(0);
    });

    it('returns empty resources array', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_MCP_ENTITLEMENTS);

      expect(result.resources).toHaveLength(0);
    });

    it('returns empty prompts array', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_MCP_ENTITLEMENTS);

      expect(result.prompts).toHaveLength(0);
    });

    it('includes MCP Access in disabledFeatures', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_MCP_ENTITLEMENTS);

      expect(result.disabledFeatures).toHaveLength(1);
      expect(result.disabledFeatures[0]).toContain('MCP Access');
    });
  });

  describe('with hasKnowledgeGraph false', () => {
    it('filters out all 5 knowledge graph tools', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      const kgToolsPresent = result.tools.filter((t) => KNOWLEDGE_GRAPH_TOOL_NAMES.has(t.name));
      expect(kgToolsPresent).toHaveLength(0);
    });

    it('filters out exactly 5 tools', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      expect(result.tools).toHaveLength(allTools.length - KNOWLEDGE_GRAPH_TOOL_NAMES.size);
    });

    it('filters out knowledge merged resource', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      const kgResourcesPresent = result.resources.filter((r) =>
        KNOWLEDGE_GRAPH_RESOURCE_URIS.has(r.uri),
      );
      expect(kgResourcesPresent).toHaveLength(0);
    });

    it('filters out exactly 1 resource', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      expect(result.resources).toHaveLength(allResources.length - KNOWLEDGE_GRAPH_RESOURCE_URIS.size);
    });

    it('includes Knowledge Graph in disabledFeatures', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      expect(result.disabledFeatures).toHaveLength(1);
      expect(result.disabledFeatures[0]).toContain('Knowledge Graph');
    });

    it('keeps all prompts even without KG', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      expect(result.prompts).toHaveLength(allPrompts.length);
    });
  });

  describe('memory tools availability', () => {
    const MEMORY_TOOL_NAMES = [
      'add_memory',
      'search_memories',
      'get_memories',
      'get_memory',
      'update_memory',
      'delete_memory',
      'promote_memory',
      'submit_feedback',
      'get_memory_history',
    ];

    it('memory tools are present when hasMcpAccess is true and hasKnowledgeGraph is false', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      for (const toolName of MEMORY_TOOL_NAMES) {
        const found = result.tools.find((t) => t.name === toolName);
        expect(found, `Expected memory tool "${toolName}" to be present`).toBeDefined();
      }
    });

    it('memory tools are present with full entitlements', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, FULL_ENTITLEMENTS);

      for (const toolName of MEMORY_TOOL_NAMES) {
        const found = result.tools.find((t) => t.name === toolName);
        expect(found, `Expected memory tool "${toolName}" to be present`).toBeDefined();
      }
    });
  });

  describe('utility tools availability', () => {
    const UTILITY_TOOL_NAMES = [
      'get_dashboard_summary',
      'get_memory_profile',
      'list_entities',
    ];

    it('utility tools are always present when hasMcpAccess is true', () => {
      const result = filterByEntitlements(allTools, allResources, allPrompts, NO_KG_ENTITLEMENTS);

      for (const toolName of UTILITY_TOOL_NAMES) {
        const found = result.tools.find((t) => t.name === toolName);
        expect(found, `Expected utility tool "${toolName}" to be present`).toBeDefined();
      }
    });
  });

  describe('with both hasMcpAccess false and hasKnowledgeGraph false', () => {
    it('returns empty arrays — hasMcpAccess has priority', () => {
      const result = filterByEntitlements(
        allTools,
        allResources,
        allPrompts,
        NO_ACCESS_NO_KG_ENTITLEMENTS,
      );

      expect(result.tools).toHaveLength(0);
      expect(result.resources).toHaveLength(0);
      expect(result.prompts).toHaveLength(0);
    });

    it('disabledFeatures mentions MCP Access only', () => {
      const result = filterByEntitlements(
        allTools,
        allResources,
        allPrompts,
        NO_ACCESS_NO_KG_ENTITLEMENTS,
      );

      expect(result.disabledFeatures).toHaveLength(1);
      expect(result.disabledFeatures[0]).toContain('MCP Access');
    });
  });
});
