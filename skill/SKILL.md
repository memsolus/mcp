---
name: memsolus
description: >
  How to use Memsolus persistent memory effectively. Use this skill whenever you have access
  to Memsolus MCP tools (add_memory, search_memories, get_knowledge, graph_search, etc.) and
  need to store, retrieve, or organize information across conversations. This skill teaches
  you when and how to use each tool for the best results — including search strategies,
  memory hygiene, knowledge graph navigation, and pool-based collaboration. Always consult
  this skill before using any Memsolus tool so you can pick the right tool and parameters.
---

# Memsolus — Persistent Memory for AI

Memsolus gives you persistent memory that survives across conversations. You can store information, search it semantically, and retrieve consolidated knowledge — turning scattered facts into structured understanding over time.

## Core Concept

When you store a memory, it enters an asynchronous pipeline:

```
You store text → Processing (embedding, categorization) → Ready for search → Consolidation into knowledge
```

Memories start as `PENDING`, become `READY` once processed, and eventually get `CONSOLIDATED` into structured knowledge entries. This means there's a brief delay between storing and searching — plan accordingly.

## When to Store Memories

Store a memory when the user shares something worth remembering for future conversations:

- **Preferences**: "I prefer TypeScript over JavaScript", "Always use dark mode"
- **Facts about the user**: their role, company, projects, team members
- **Decisions made**: "We decided to use PostgreSQL for this project"
- **Instructions that should persist**: "Never suggest jQuery", "Always write tests first"
- **Context that helps future interactions**: project architecture, naming conventions, workflows

Do NOT store:
- Ephemeral task details (current file being edited, temporary debugging state)
- Information already in the conversation context
- Exact code snippets (store the decision/pattern, not the implementation)

## Tool Selection Guide

### Storing Information

| Situation | Tool | Why |
|-----------|------|-----|
| User shares a preference or fact | `add_memory` | Single memory, default priority |
| Critical rule the user emphasizes | `add_memory` with `priority: HIGH` | HIGH memories rank higher in search and resist consolidation pruning |
| Information relevant to a team/project | `add_memory_to_pool` | Shared across pool members |

**Tips for `add_memory`:**
- Write the content as a clear, standalone statement. "The user prefers concise responses without emojis" is better than "prefers concise, no emojis" because it's self-contained when retrieved later.
- Use `user_id` to scope memories per end-user. Without it, memories are global to the workspace.
- Use `session_id` to group memories from the same conversation — useful for context clustering.
- Set `priority: HIGH` sparingly. It's for rules and strong preferences, not every fact.

### Retrieving Information

This is the most important decision. You have three retrieval tools, each for different situations:

| Situation | Tool | Why |
|-----------|------|-----|
| Need specific context for a task | `search_memories` | Semantic search finds relevant memories even with different wording |
| Want the full picture of what you know about someone | `get_knowledge` with `merged: true` | Returns all consolidated knowledge as one text — ideal for building context |
| Need to browse/audit stored memories | `get_memories` | Paginated list with filters, no semantic ranking |
| Looking for a specific memory you know exists | `get_memory` | Direct lookup by ID |

**`search_memories` — your primary retrieval tool:**

Choose the right search mode based on what you're looking for:

- **`hybrid`** (default) — Best for most queries. Combines semantic understanding with keyword matching. Use this when the user asks a question and you need relevant context.
- **`semantic`** — Pure meaning-based search. Use when the query is conceptual: "what does the user think about testing?" will find memories about TDD, unit tests, and quality assurance even if those exact words aren't in the query.
- **`keyword`** — Exact text matching. Use for names, IDs, specific terms, or technical identifiers: "PostgreSQL", "project-alpha", "João Silva". Faster than semantic.

**`get_knowledge` — for consolidated understanding:**

Knowledge is automatically compiled from your memories by the pipeline. It's organized by category (preferences, work, projects, etc.) and versioned.

- Use `merged: true` to get everything as one Markdown text — perfect for injecting as context at the start of a conversation.
- Use `category` to filter when you only need one domain (e.g., just "preferences").
- If it returns nothing, memories haven't been consolidated yet — fall back to `search_memories`.

### Managing Memories

| Situation | Tool |
|-----------|------|
| Fix incorrect information | `update_memory` — overwrites content, triggers re-processing |
| Remove outdated/wrong memory | `delete_memory` |
| User wants a fresh start | `delete_all_memories` — use with caution, scoped by user_id/agent_id |
| See who has memories stored | `list_entities` |

### Knowledge Graph

The graph is built automatically from memories — entities (people, organizations, technologies) and their relationships are extracted.

| Situation | Tool | Why |
|-----------|------|-----|
| Find people/things related to a topic | `graph_search` | Semantic search over entities |
| Explore connections from a known entity | `graph_traverse` | Follow relationships 1-3 hops deep |
| Answer a question about relationships | `graph_query` | Natural language question → structured answer |

**Graph tips:**
- `graph_search` is best for discovery: "who works on project Alpha?"
- `graph_traverse` is best for exploration: start from an entity and see what's connected
- `graph_query` uses the LLM to interpret your question — it's the most powerful but consumes tokens
- Filter by `type` (PERSON, ORGANIZATION, TECHNOLOGY, etc.) to narrow results

### Pools (Shared Memory)

Pools let multiple users/agents share a common memory space.

| Situation | Tool |
|-----------|------|
| See available shared pools | `list_pools` |
| Add information to a shared pool | `add_memory_to_pool` |
| Search within a specific pool | `search_pool` |
| Include pool memories in a general search | `search_memories` with `include_pool_memories: true` |

## Recommended Workflows

### Start of Conversation

When beginning a new conversation with a user you might have memories for:

1. Call `get_knowledge` with `user_id` and `merged: true` to load their consolidated profile
2. If no knowledge exists yet, call `search_memories` with a broad query about the user
3. Use the retrieved context to personalize your responses from the start

### During Conversation

- When the user shares something new and important → `add_memory`
- When you need context for a task → `search_memories` with the right mode
- When the user corrects something you remembered wrong → `update_memory` or `delete_memory` + `add_memory`

### Proactive Memory Use

Don't wait to be asked. If you notice the user has a preference pattern (always asks for TypeScript, always wants concise answers), store it proactively. The goal is that future conversations get better over time.

## Writing Good Memory Content

The quality of stored content directly affects search and consolidation quality.

**Good memories:**
- "The user is a senior backend developer at TechCorp, working primarily with NestJS and PostgreSQL"
- "Project Alpha uses a microservices architecture with 5 services communicating via RabbitMQ"
- "The user strongly prefers functional programming patterns over OOP when possible"

**Bad memories:**
- "dev, nestjs, postgres" — too terse, no context
- "The user said they like the thing we discussed" — vague, won't make sense later
- "Here is the full source code of auth.service.ts: ..." — too long, store the pattern not the code

## Priority Guide

| Priority | When to use | Effect |
|----------|-------------|--------|
| `LOW` | Nice-to-know information, casual observations | Lower weight in search ranking, may be pruned during consolidation |
| `MEDIUM` | Standard facts, preferences, project context (default) | Normal processing |
| `HIGH` | Critical rules, strong user preferences, important decisions | Higher weight in search, resistant to consolidation pruning |

## Error Handling

- If `search_memories` returns empty results, try a different `mode` or broaden your query
- If `get_knowledge` fails, memories may not be consolidated yet — use `search_memories` instead
- If `add_memory` returns status `PENDING`, the memory was accepted but isn't searchable yet — this is normal
- If you get a permission error, the API key may not have the required permission for that tool
