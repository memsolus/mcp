import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ApiClient } from './api-client.js';

interface ApiResponse<T> {
  data: T;
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

type ToolRegistrar = (
  name: string,
  description: string,
  schema: Record<string, z.ZodType>,
  handler: (args: Record<string, unknown>) => Promise<unknown>,
) => void;

function textResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}

export function registerTools(server: McpServer, client: ApiClient): void {
  const tool = server.tool.bind(server) as unknown as ToolRegistrar;

  // ── Memory CRUD ─────────────────────────────────────────────

  tool(
    'add_memory',
    `Store a new persistent memory. Use when the user shares a fact, preference, decision, or any context worth remembering across conversations.

When to use: User states a preference ("I prefer dark mode"), shares a fact ("Our API runs on port 3000"), makes a decision ("We chose PostgreSQL"), or says "remember this".
When NOT to use: Temporary info, greetings, acknowledgments, or things that only matter for the current conversation.

The memory enters an async pipeline: extraction → embedding → consolidation → knowledge compilation. It becomes searchable within seconds.`,
    {
      memory: z.string().describe('A clear, self-contained statement. Write as a complete sentence, e.g. "Prefers TypeScript over JavaScript for backend" or "O projeto usa NestJS 11 com Fastify". Use the SAME LANGUAGE the user spoke in.'),
      user_id: z.string().optional().describe('End-user ID to scope this memory. Without it, memory is global to the workspace.'),
      agent_id: z.string().optional().describe('Agent ID storing this memory. For multi-agent setups.'),
      session_id: z.string().optional().describe('Current session ID. Groups memories from the same conversation.'),
      metadata: z.string().optional().describe('JSON string with structured data, e.g. \'{"source": "chat", "topic": "infrastructure"}\'.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('LOW = supplementary, may be summarized. MEDIUM (default) = standard facts. HIGH = critical rules the user explicitly emphasized ("always", "never", "must").'),
      pool_id: z.string().optional().describe('UUID of a shared pool. Prefer add_memory_to_pool for clearer intent.'),
    },
    async (args) => {
      let metadata: Record<string, unknown> | undefined;
      if (args.metadata) {
        try {
          metadata = JSON.parse(args.metadata as string);
        } catch {
          // ignore
        }
      }

      const body: Record<string, unknown> = {
        memory: args.memory,
        user_id: args.user_id,
        agent_id: args.agent_id,
        session_id: args.session_id,
        metadata,
        priority: args.priority,
        pool_id: args.pool_id,
      };

      const res = await client.post<ApiResponse<Record<string, unknown>>>('/v1/memories', body);
      return textResult({
        id: res.data.id,
        priority: res.data.priority,
        message: 'Memory accepted for processing. Embedding generation, categorization, and knowledge consolidation happen in the background.',
      });
    },
  );

  tool(
    'search_memories',
    `Find relevant memories by meaning, keywords, or both. This is the primary retrieval tool.

When to use: You need context about a topic, want to recall stored info, or the user asks "what do you know about X?".
When NOT to use: You need the full user profile (use get_knowledge instead) or want to browse chronologically (use get_memories).

Search modes:
- hybrid (default): combines semantic + keyword — best for most queries
- semantic: finds conceptually related memories even with different wording — use for "how does X work?"
- keyword: exact term matching — use for names, IDs, file paths, specific technical terms`,
    {
      query: z.string().describe('Natural language query. Be specific: "user preferences for code style" > "preferences". Use the same language the memories were stored in.'),
      user_id: z.string().optional().describe('Scope to one user. Omit to search all users in workspace.'),
      agent_id: z.string().optional().describe('Scope to one agent.'),
      limit: z.number().optional().describe('Max results (default 10, max 100). Start with 10.'),
      mode: z.enum(['hybrid', 'semantic', 'keyword']).optional().describe('Search strategy. Default: hybrid.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Filter to one priority level only.'),
      pool_id: z.string().optional().describe('Restrict to a specific shared pool.'),
      include_pool_memories: z.boolean().optional().describe('Also include memories from pools the user belongs to. Default false.'),
    },
    async (args) => {
      const params: Record<string, string | number | boolean | undefined> = {
        search: args.query as string,
        user_id: args.user_id as string | undefined,
        agent_id: args.agent_id as string | undefined,
        page_size: args.limit as number | undefined,
        mode: args.mode as string | undefined,
        priority: args.priority as string | undefined,
        pool_id: args.pool_id as string | undefined,
        include_pool_memories: args.include_pool_memories as boolean | undefined,
      };

      const res = await client.get<ApiResponse<Record<string, unknown>[]>>('/v1/memories', params);
      return textResult({
        memories: res.data.map((m) => ({
          id: m.id,
          memory: m.memory,
          user_id: m.user_id,
          agent_id: m.agent_id,
          priority: m.priority,
          metadata: m.metadata,
          categories: m.categories,
          created_at: m.created_at,
        })),
        total: res.meta?.total,
        page: res.meta?.current_page,
        page_size: res.meta?.per_page,
      });
    },
  );

  tool(
    'get_memories',
    `List stored memories chronologically with pagination. Unlike search_memories, this does NOT rank by relevance.

When to use: Browsing, auditing, or when you need to see everything — not find something specific.
When NOT to use: Looking for specific info (use search_memories) or loading user profile (use get_knowledge).`,
    {
      user_id: z.string().optional().describe('Filter to one user.'),
      agent_id: z.string().optional().describe('Filter to one agent.'),
      page: z.number().optional().describe('Page number (starts at 1).'),
      page_size: z.number().optional().describe('Items per page (default 10, max 100).'),
    },
    async (args) => {
      const res = await client.get<ApiResponse<Record<string, unknown>[]>>('/v1/memories', {
        user_id: args.user_id as string | undefined,
        agent_id: args.agent_id as string | undefined,
        page: args.page as number | undefined,
        page_size: args.page_size as number | undefined,
      });

      return textResult({
        memories: res.data.map((m) => ({
          id: m.id,
          memory: m.memory,
          user_id: m.user_id,
          agent_id: m.agent_id,
          priority: m.priority,
          metadata: m.metadata,
          categories: m.categories,
          created_at: m.created_at,
        })),
        total: res.meta?.total,
        page: res.meta?.current_page,
        page_size: res.meta?.per_page,
      });
    },
  );

  tool(
    'get_memory',
    'Retrieve a single memory by ID. Use when you have an ID from search results and need full details (timestamps, metadata, categories).',
    {
      memory_id: z.string().describe('UUID of the memory.'),
    },
    async (args) => {
      const res = await client.get<ApiResponse<Record<string, unknown>>>(`/v1/memories/${args.memory_id}`);
      const m = res.data;
      return textResult({
        id: m.id,
        memory: m.memory,
        user_id: m.user_id,
        agent_id: m.agent_id,
        priority: m.priority,
        metadata: m.metadata,
        categories: m.categories,
        created_at: m.created_at,
        updated_at: m.updated_at,
      });
    },
  );

  tool(
    'update_memory',
    `Replace an existing memory with new text. Triggers re-processing (new embedding, re-categorization, re-consolidation).

When to use: User corrects a fact, a preference changed, or info is outdated. PREFER this over delete+add when fixing existing info.
When NOT to use: The info is completely wrong and should just be removed (use delete_memory).`,
    {
      memory_id: z.string().describe('UUID of the memory to update.'),
      memory: z.string().describe('New memory text that fully replaces the existing one. Write as a complete, self-contained statement.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Optionally change priority.'),
    },
    async (args) => {
      const body: Record<string, unknown> = {
        memory: args.memory,
      };
      if (args.priority) {
        body.priority = args.priority;
      }

      const res = await client.put<ApiResponse<Record<string, unknown>>>(`/v1/memories/${args.memory_id}`, body);
      return textResult({
        id: res.data.id,
        priority: res.data.priority,
        message: 'Memory updated. Re-processing will run asynchronously.',
      });
    },
  );

  tool(
    'delete_memory',
    `Permanently remove a memory by ID. Also removes it from vector index and knowledge graph.

When to use: Info is completely wrong, user explicitly says "forget this" or "remove that".
When NOT to use: Info just needs correction (use update_memory instead).`,
    {
      memory_id: z.string().describe('UUID of the memory to delete. Search first if you only have the memory text.'),
    },
    async (args) => {
      await client.delete(`/v1/memories/${args.memory_id}`);
      return textResult({ message: 'Memory deleted.' });
    },
  );

  tool(
    'list_entities',
    'List all users and agents that have stored memories, with memory count per entity. Use to discover who is in the system before scoping searches.',
    {},
    async () => {
      const res = await client.get<ApiResponse<unknown[]>>('/v1/memories/entities');
      return textResult(res.data);
    },
  );

  // ── Knowledge ───────────────────────────────────────────────

  tool(
    'get_knowledge',
    `Retrieve the user's consolidated knowledge profile — a structured Markdown document compiled automatically from their memories.

When to use: START OF EVERY CONVERSATION. Call with merged=true to load the full user context before responding. This is the most efficient way to understand who the user is and what they care about.
When NOT to use: Looking for specific info (use search_memories). Knowledge may not exist yet for brand-new users — fall back to search_memories if this returns empty.

Knowledge is compiled from memories through the processing pipeline: individual memories → consolidation → grouped topics → knowledge base. It maintains versions and gets richer as more memories are added.`,
    {
      user_id: z.string().optional().describe('User whose knowledge to load. Defaults to "default".'),
      category: z.string().optional().describe('Filter to one category (e.g. "preferences", "work", "projects"). Omit for all.'),
      merged: z.boolean().optional().describe('true = single Markdown document with all categories (RECOMMENDED for context loading). false = categories returned separately.'),
    },
    async (args) => {
      try {
        const res = await client.get<ApiResponse<unknown>>('/v1/knowledge', {
          user_id: args.user_id as string | undefined,
          category: args.category as string | undefined,
          merged: args.merged as boolean | undefined,
        });
        return textResult(res.data);
      } catch {
        return textResult({
          content: null,
          message: 'No knowledge available yet. Knowledge is compiled automatically after memories are processed and consolidated — this may take a moment for new users.',
        });
      }
    },
  );

  // ── Pools ───────────────────────────────────────────────────

  tool(
    'list_pools',
    'List all shared memory pools in the workspace. Pools are collaborative spaces where multiple users/agents contribute and read memories. Returns name, access level, member count, and memory count per pool.',
    {},
    async () => {
      const res = await client.get<ApiResponse<unknown[]>>('/v1/memory-pools');
      return textResult({ pools: res.data });
    },
  );

  tool(
    'add_memory_to_pool',
    `Store a memory in a shared pool, visible to all pool members. Use instead of add_memory when info is relevant to a team/group, not just one user.

When to use: Team decisions, shared project facts, group preferences. Example: "The team agreed to use PostgreSQL for all new services."
When NOT to use: Personal preferences or individual context (use add_memory).`,
    {
      pool_id: z.string().describe('UUID of the target pool (get from list_pools).'),
      memory: z.string().describe('Clear, self-contained statement. Same language as the user.'),
      user_id: z.string().optional().describe('User contributing this memory.'),
      agent_id: z.string().optional().describe('Agent contributing this memory.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Priority level.'),
      metadata: z.string().optional().describe('JSON string with structured data.'),
    },
    async (args) => {
      let metadata: Record<string, unknown> | undefined;
      if (args.metadata) {
        try {
          metadata = JSON.parse(args.metadata as string);
        } catch {
          // ignore
        }
      }

      const body: Record<string, unknown> = {
        memory: args.memory,
        user_id: args.user_id,
        agent_id: args.agent_id,
        priority: args.priority,
        metadata,
        pool_id: args.pool_id,
      };

      const res = await client.post<ApiResponse<Record<string, unknown>>>('/v1/memories', body);
      return textResult({
        id: res.data.id,
        pool_id: args.pool_id,
        message: 'Memory accepted for processing. Visible to all pool members after completion.',
      });
    },
  );

  tool(
    'search_pool',
    'Search within a specific shared pool. Like search_memories but scoped to one pool. Use for team/project context.',
    {
      pool_id: z.string().describe('UUID of the pool to search.'),
      query: z.string().describe('Natural language query in the same language as pool memories.'),
      limit: z.number().optional().describe('Max results (default 10).'),
      mode: z.enum(['hybrid', 'semantic', 'keyword']).optional().describe('Search strategy. Default: hybrid.'),
    },
    async (args) => {
      const res = await client.get<ApiResponse<Record<string, unknown>[]>>('/v1/memories', {
        search: args.query as string,
        pool_id: args.pool_id as string,
        page_size: args.limit as number | undefined,
        mode: args.mode as string | undefined,
      });

      return textResult({
        memories: res.data.map((m) => ({
          id: m.id,
          memory: m.memory,
          user_id: m.user_id,
          agent_id: m.agent_id,
          priority: m.priority,
          categories: m.categories,
          created_at: m.created_at,
        })),
        total: res.meta?.total,
      });
    },
  );

  // ── Knowledge Graph ─────────────────────────────────────────

  tool(
    'graph_search',
    `Search the knowledge graph for entities (people, organizations, technologies, projects, etc.) by semantic similarity. Entities and relationships are automatically extracted from memories.

When to use: Discover who/what is mentioned in memories, find entities by concept ("frontend tools", "team members"), or check if an entity exists before traversing.
When NOT to use: Looking for memory content (use search_memories). Looking for relationship paths (use graph_traverse after finding the entity here).`,
    {
      query: z.string().describe('Name, role, technology, or concept. E.g. "frontend developers", "NestJS", "João".'),
      user_id: z.string().optional().describe('Scope to one user\'s entities.'),
      type: z.string().optional().describe('Filter: PERSON, ORGANIZATION, LOCATION, TECHNOLOGY, PROJECT, ROLE, EVENT, CONCEPT.'),
      limit: z.number().min(1).max(50).optional().describe('Max entities (default 10).'),
    },
    async (args) => {
      const res = await client.get<ApiResponse<unknown>>('/v1/graph/search', {
        query: args.query as string,
        user_id: args.user_id as string | undefined,
        type: args.type as string | undefined,
        limit: args.limit as number | undefined,
      });
      return textResult(res.data);
    },
  );

  tool(
    'graph_traverse',
    `Walk relationships from a starting entity, bidirectionally, up to 3 hops deep.

When to use: You found an entity via graph_search and want to discover connections. E.g. from a person → their organization, projects, technologies. From a technology → who uses it, what depends on it.
When NOT to use: You don't have an entity ID yet (use graph_search first). You want a natural language answer (use graph_query).

Typical workflow: graph_search("João") → get entity ID → graph_traverse(from=id) → see all connections.`,
    {
      from: z.string().uuid().describe('UUID of starting entity (from graph_search results).'),
      depth: z.number().min(1).max(3).optional().describe('Hops to follow (default 2, max 3). Higher = more connections but more data.'),
      relationship_type: z.string().optional().describe('Only this relationship type: WORKS_AT, USES, KNOWS, MANAGES, DEPENDS_ON, etc. Omit for all.'),
      entity_type: z.string().optional().describe('Only target entities of this type: PERSON, ORGANIZATION, TECHNOLOGY, PROJECT, etc.'),
      limit: z.number().min(1).max(100).optional().describe('Max connected nodes (default 50).'),
    },
    async (args) => {
      const res = await client.get<ApiResponse<unknown>>('/v1/graph/traverse', {
        from: args.from as string,
        depth: args.depth as number | undefined,
        relationship_type: args.relationship_type as string | undefined,
        entity_type: args.entity_type as string | undefined,
        limit: args.limit as number | undefined,
      });
      return textResult(res.data);
    },
  );

  tool(
    'graph_query',
    `Ask a natural language question about the knowledge graph and get an AI-generated answer. Most powerful graph tool — uses LLM to interpret relationships and compose an answer.

When to use: Complex relationship questions. Examples: "Who on the team knows Kubernetes?", "What technologies does Project Alpha use?", "How are João and TechCorp connected?"
When NOT to use: Simple entity lookup (use graph_search — cheaper). Simple memory retrieval (use search_memories — faster). This tool consumes LLM tokens for answer generation.`,
    {
      query: z.string().describe('Natural language question about entities and relationships. Be specific.'),
      user_id: z.string().optional().describe('Scope to one user\'s graph data.'),
      limit: z.number().min(1).max(20).optional().describe('Max entities to consider (default 10). Higher = more complete but slower.'),
    },
    async (args) => {
      const body: Record<string, unknown> = {
        query: args.query,
        user_id: args.user_id,
        limit: args.limit,
      };
      const res = await client.post<ApiResponse<unknown>>('/v1/graph/query', body);
      return textResult(res.data);
    },
  );
}
