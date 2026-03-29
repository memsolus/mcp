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
    'Store a new piece of information as a persistent memory — preferences, facts, decisions, or any context worth remembering across conversations. The memory enters an async processing pipeline and becomes searchable once processed (status changes from PENDING to READY). Write content as clear, standalone statements.',
    {
      content: z.string().describe('A clear, self-contained statement of what to remember. Write as a complete sentence that makes sense without additional context, e.g. "The user prefers TypeScript over JavaScript for backend development."'),
      user_id: z.string().optional().describe('Identifier for the end-user this memory belongs to. Use this to keep memories separate per person. Without it, the memory is global to the workspace.'),
      agent_id: z.string().optional().describe('Identifier for the AI agent storing this memory. Useful for multi-agent setups where different agents manage different contexts.'),
      session_id: z.string().optional().describe('Identifier for the current conversation session. Groups memories from the same interaction for better context clustering.'),
      metadata: z.string().optional().describe('JSON string with additional structured data, e.g. \'{"source": "chat", "confidence": 0.9}\'. Stored alongside the memory for filtering.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('LOW = nice-to-know, may be pruned during consolidation. MEDIUM (default) = standard facts and preferences. HIGH = critical rules or strong preferences the user explicitly emphasized — ranked higher in search and resistant to pruning.'),
      pool_id: z.string().optional().describe('UUID of a shared memory pool. When provided, the memory becomes visible to all pool members. Use add_memory_to_pool tool instead if you want clearer intent.'),
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
        content: args.content,
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
        status: res.data.status,
        priority: res.data.priority,
        message: 'Memory stored. It will be processed asynchronously — embedding generation, categorization, and knowledge consolidation happen in the background.',
      });
    },
  );

  tool(
    'search_memories',
    'Find relevant memories using semantic similarity, keyword matching, or both. This is your primary retrieval tool — use it when you need context for a task, want to recall what you know about a topic, or need to find specific information. Choose the search mode based on your needs: "hybrid" (default) combines meaning + keywords for best overall quality, "semantic" finds conceptually related memories even with different wording, "keyword" matches exact terms like names and IDs.',
    {
      query: z.string().describe('What you are looking for, in natural language. Be specific — "user preferences for code style" works better than just "preferences".'),
      user_id: z.string().optional().describe('Scope search to a specific end-user. Omit to search across all users in the workspace.'),
      agent_id: z.string().optional().describe('Scope search to memories from a specific agent.'),
      limit: z.number().optional().describe('Maximum results to return (default 10, max 100). Start with 10, increase if you need more comprehensive results.'),
      mode: z.enum(['hybrid', 'semantic', 'keyword']).optional().describe('hybrid (default): best general-purpose, combines semantic understanding with keyword matching. semantic: pure meaning-based, finds related concepts even with different words — use for conceptual questions. keyword: exact text matching, use for names, IDs, specific technical terms.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Filter results to only this priority level. Useful when you specifically need HIGH-priority rules or preferences.'),
      pool_id: z.string().optional().describe('Restrict search to memories within a specific shared pool.'),
      include_pool_memories: z.boolean().optional().describe('When true, also includes memories from pools the user is a member of. Default false — set to true when you want the broadest possible context.'),
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
          memory: m.content,
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
    'Browse through all stored memories with pagination and optional filters. Unlike search_memories, this does NOT rank by relevance — it returns memories in chronological order. Use this for auditing, browsing, or when you need to see everything rather than find something specific.',
    {
      user_id: z.string().optional().describe('Filter to a specific end-user.'),
      agent_id: z.string().optional().describe('Filter to a specific agent.'),
      page: z.number().optional().describe('Page number, starting at 1.'),
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
          memory: m.content,
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
    'Retrieve a single memory by its exact ID. Use this when you already have a memory ID from a previous search result and need the full details including status and timestamps.',
    {
      memory_id: z.string().describe('The UUID of the memory to retrieve.'),
    },
    async (args) => {
      const res = await client.get<ApiResponse<Record<string, unknown>>>(`/v1/memories/${args.memory_id}`);
      const m = res.data;
      return textResult({
        id: m.id,
        memory: m.content,
        user_id: m.user_id,
        agent_id: m.agent_id,
        priority: m.priority,
        metadata: m.metadata,
        categories: m.categories,
        status: m.status,
        created_at: m.created_at,
        updated_at: m.updated_at,
      });
    },
  );

  tool(
    'update_memory',
    'Replace the content of an existing memory. Use this to correct inaccurate information or update outdated facts. The memory will be re-processed through the pipeline (new embedding, re-categorization, re-consolidation).',
    {
      memory_id: z.string().describe('The UUID of the memory to update.'),
      content: z.string().describe('The new content that fully replaces the existing text. Write as a complete, self-contained statement.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Optionally change the priority level.'),
    },
    async (args) => {
      const body: Record<string, unknown> = {
        content: args.content,
      };
      if (args.priority) {
        body.priority = args.priority;
      }

      const res = await client.put<ApiResponse<Record<string, unknown>>>(`/v1/memories/${args.memory_id}`, body);
      return textResult({
        id: res.data.id,
        status: res.data.status,
        priority: res.data.priority,
        message: 'Memory updated. Re-processing will run asynchronously.',
      });
    },
  );

  tool(
    'delete_memory',
    'Permanently remove a single memory by its ID. Use when information is wrong, outdated, or the user asks you to forget something specific. The memory is also removed from the search index and knowledge graph.',
    {
      memory_id: z.string().describe('The UUID of the memory to delete.'),
    },
    async (args) => {
      await client.delete(`/v1/memories/${args.memory_id}`);
      return textResult({ message: 'Memory deleted.' });
    },
  );

  tool(
    'list_entities',
    'List all distinct users and agents that have memories stored, with a count of how many memories each has. Useful for understanding who is using the memory system and how much data exists per person.',
    {},
    async () => {
      const res = await client.get<ApiResponse<unknown[]>>('/v1/memories/entities');
      return textResult(res.data);
    },
  );

  tool(
    'delete_all_memories',
    'Delete ALL memories for a given user or agent scope. This is a destructive bulk operation — use with caution and only when the user explicitly asks to start fresh or wipe their data. At least one of user_id or agent_id should be provided to scope the deletion.',
    {
      user_id: z.string().optional().describe('Delete all memories for this user.'),
      agent_id: z.string().optional().describe('Delete all memories for this agent.'),
    },
    async (args) => {
      await client.delete('/v1/memories', {
        user_id: args.user_id as string | undefined,
        agent_id: args.agent_id as string | undefined,
      });
      return textResult({ message: 'All matching memories deleted.' });
    },
  );

  // ── Knowledge ───────────────────────────────────────────────

  tool(
    'get_knowledge',
    'Retrieve the consolidated knowledge profile for a user. Knowledge is automatically compiled from memories by the processing pipeline — it groups related memories into structured categories (preferences, work, projects, etc.) and maintains versions. Use with merged=true to get a single Markdown text with all categories, ideal for loading full user context at the start of a conversation. Returns nothing if memories have not been consolidated yet — fall back to search_memories in that case.',
    {
      user_id: z.string().optional().describe('The user whose knowledge to retrieve. Defaults to "default" if omitted.'),
      category: z.string().optional().describe('Filter to a specific category, e.g. "preferences", "work", "projects". Returns all categories if omitted.'),
      merged: z.boolean().optional().describe('When true, merges all categories into a single Markdown text — the most useful format for building conversation context. Default false returns each category separately.'),
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
    'List all shared memory pools in the current workspace. Pools are collaborative memory spaces where multiple users or agents can contribute and read memories. Shows each pool with its name, access level, member count, and memory count.',
    {},
    async () => {
      const res = await client.get<ApiResponse<unknown[]>>('/v1/memory-pools');
      return textResult({ pools: res.data });
    },
  );

  tool(
    'add_memory_to_pool',
    'Store a memory inside a shared pool, making it visible to all pool members. Use this instead of add_memory when the information is relevant to a team or group context rather than just one user. The memory is processed through the same pipeline as regular memories.',
    {
      pool_id: z.string().describe('UUID of the target pool.'),
      content: z.string().describe('The memory content — a clear, self-contained statement.'),
      user_id: z.string().optional().describe('The user contributing this memory.'),
      agent_id: z.string().optional().describe('The agent contributing this memory.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Priority level for this memory.'),
      metadata: z.string().optional().describe('JSON string with additional structured data.'),
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
        content: args.content,
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
        status: res.data.status,
        message: 'Memory added to pool. Visible to all pool members after processing.',
      });
    },
  );

  tool(
    'search_pool',
    'Search memories within a specific shared pool. Works like search_memories but scoped to one pool. Use this when you need context from a team or project pool rather than searching across all personal memories.',
    {
      pool_id: z.string().describe('UUID of the pool to search within.'),
      query: z.string().describe('Natural language search query.'),
      limit: z.number().optional().describe('Maximum results (default 10).'),
      mode: z.enum(['hybrid', 'semantic', 'keyword']).optional().describe('Search strategy: hybrid (default), semantic, or keyword.'),
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
          memory: m.content,
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
    'Search the knowledge graph for entities (people, organizations, technologies, etc.) using semantic similarity. Entities and their relationships are automatically extracted from memories. Use this to discover who or what is mentioned in the stored memories and how they relate to each other.',
    {
      query: z.string().describe('What you are looking for — a name, role, technology, or concept. E.g. "frontend developers", "machine learning tools".'),
      user_id: z.string().optional().describe('Scope to entities from a specific user\'s memories.'),
      type: z.string().optional().describe('Filter by entity type: PERSON, ORGANIZATION, LOCATION, EVENT, CONCEPT, PRODUCT, TECHNOLOGY, or OTHER.'),
      limit: z.number().min(1).max(50).optional().describe('Maximum entities to return (default 10).'),
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
    'Explore the knowledge graph by walking relationships from a starting entity. Follows connections bidirectionally up to 3 hops deep. Use this when you found an entity via graph_search and want to discover what it connects to — e.g. starting from a person, find their organization, projects, and technologies.',
    {
      from: z.string().uuid().describe('UUID of the starting entity (get this from graph_search results).'),
      depth: z.number().min(1).max(3).optional().describe('How many relationship hops to follow (default 2, max 3). Higher depth finds more distant connections but returns more data.'),
      relationship_type: z.string().optional().describe('Only follow this type of relationship, e.g. "WORKS_AT", "USES", "KNOWS". Omit to follow all types.'),
      entity_type: z.string().optional().describe('Only include target entities of this type: PERSON, ORGANIZATION, TECHNOLOGY, etc.'),
      limit: z.number().min(1).max(100).optional().describe('Maximum connected nodes to return (default 50).'),
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
    'Ask a natural language question about the knowledge graph and get a structured answer. The system extracts entities from your question, searches the graph, and generates an answer based on discovered relationships. This is the most powerful graph tool but consumes LLM tokens. Use for complex relationship questions like "Who on the team has experience with Kubernetes?" or "What technologies is Project Alpha built with?"',
    {
      query: z.string().describe('A natural language question about entities and relationships in the knowledge base.'),
      user_id: z.string().optional().describe('Scope the graph to a specific user\'s data.'),
      limit: z.number().min(1).max(20).optional().describe('Maximum entities to consider when answering (default 10).'),
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
