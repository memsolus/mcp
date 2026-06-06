# @memsolus/mcp

**MCP Server for Memsolus — persistent memory, knowledge graphs, and semantic search for AI agents**

[![npm version](https://img.shields.io/npm/v/@memsolus/mcp)](https://www.npmjs.com/package/@memsolus/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP compatible](https://img.shields.io/badge/MCP-compatible-green)](https://modelcontextprotocol.io)

[Documentation](https://docs.memsolus.com) &nbsp;|&nbsp;
[npm](https://www.npmjs.com/package/@memsolus/mcp) &nbsp;|&nbsp;
[GitHub](https://github.com/memsolus/mcp) &nbsp;|&nbsp;
[memsolus.com](https://memsolus.com)

---

## What is Memsolus?

Memsolus is a persistent memory platform for AI agents. It lets your AI assistant remember context across conversations, track decisions, search past knowledge, and navigate entity relationships through a knowledge graph.

This package exposes the full Memsolus API as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server, so any MCP-compatible AI client — Claude Desktop, Claude Code, Cursor, Windsurf, VS Code Copilot, Zed, and others — can store and retrieve memories, query knowledge, and traverse entity graphs without custom integration code.

---

## Prerequisites

- A Memsolus account ([sign up](https://app.memsolus.com))
- An API key (see [Getting an API Key](#getting-an-api-key) below)
- Node.js 18+ or Bun

---

## Getting an API Key

1. Sign up or log in at [app.memsolus.com](https://app.memsolus.com)
2. Go to **Settings** > **API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., `Claude Desktop`)
5. Select permissions: at minimum `MemoryRead` and `MemoryWrite`. For full access, also enable `KnowledgeRead` and `DashboardRead`
6. Copy the key — it starts with `msk_` and you will not be able to see it again after closing the dialog
7. Set the key as the `MEMSOLUS_API_KEY` environment variable or paste it directly into your client config

---

## Installation

Choose the section that matches your AI client. All configurations use `npx -y @memsolus/mcp`, which runs the latest published version without a local install step.

### Claude Code

Run this command in your terminal:

```bash
claude mcp add memsolus -- npx -y @memsolus/mcp
```

To pass the API key inline without setting an environment variable:

```bash
claude mcp add memsolus -e MEMSOLUS_API_KEY=msk_your_key_here -- npx -y @memsolus/mcp
```

After adding, restart Claude Code or run `/mcp` to confirm that `memsolus` appears in the server list.

---

### Claude Desktop

Locate and open your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following entry inside `mcpServers`:

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "msk_your_key_here"
      }
    }
  }
}
```

Save the file and restart Claude Desktop. The Memsolus tools will appear in the tools panel on the next launch.

---

### Cursor

Create or edit `.cursor/mcp.json` in your project root (or the global Cursor MCP config at `~/.cursor/mcp.json` for workspace-independent access):

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "msk_your_key_here"
      }
    }
  }
}
```

Reload Cursor or run the **MCP: Restart Servers** command from the command palette.

---

### Windsurf

Open your Windsurf MCP configuration (`~/.codeium/windsurf/mcp_config.json`) and add:

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "msk_your_key_here"
      }
    }
  }
}
```

Restart Windsurf to apply the changes.

---

### VS Code (GitHub Copilot)

Add a `.vscode/mcp.json` file to your workspace:

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "msk_your_key_here"
      }
    }
  }
}
```

Alternatively, add the same block to your VS Code user `settings.json` under `"mcp"` to enable it globally. Reload the VS Code window after saving.

---

### Zed

Open your Zed settings (`~/.config/zed/settings.json`) and add a `context_servers` entry:

```json
{
  "context_servers": {
    "memsolus": {
      "command": {
        "path": "npx",
        "args": ["-y", "@memsolus/mcp"],
        "env": {
          "MEMSOLUS_API_KEY": "msk_your_key_here"
        }
      }
    }
  }
}
```

Restart Zed to pick up the new server.

---

### Using an Environment Variable Instead

If you prefer not to embed your API key in config files, export it in your shell profile (`~/.bashrc`, `~/.zshrc`, or equivalent):

```bash
export MEMSOLUS_API_KEY=msk_your_key_here
```

With the variable set globally, all client configs can omit the `env` block:

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"]
    }
  }
}
```

---

## Configuration

The server is configured entirely through environment variables. No config file is needed.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MEMSOLUS_API_KEY` | Yes | — | Your API key (starts with `msk_`) |
| `MEMSOLUS_API_URL` | No | `https://api.memsolus.com` | Override the API endpoint (e.g., for self-hosted deployments) |
| `MEMSOLUS_WORKSPACE_ID` | No | — | Target a specific workspace. Omit to use the default workspace associated with your API key |

---

## Available Tools

The server exposes 17 tools across four categories. Which tools are available depends on your plan — see [Plan-Based Tool Availability](#plan-based-tool-availability).

### Memory Tools

These tools are available on all plans that include MCP access.

#### `add_memory`

Store a new persistent memory. Use when the user shares a fact, preference, decision, or any context worth remembering across future conversations.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `memory` | string | Yes | Content of the memory to store |
| `user_id` | string | No | Associate the memory with a specific user |
| `agent_id` | string | No | Associate the memory with a specific agent |
| `session_id` | string | No | Associate the memory with a specific session |
| `metadata` | string | No | JSON string with arbitrary key-value metadata |
| `priority` | string | No | `LOW`, `MEDIUM` (default), or `HIGH` |

---

#### `search_memories`

Search stored memories by relevance. Supports semantic, keyword, and hybrid search modes.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Natural language search query |
| `user_id` | string | No | Restrict results to a specific user |
| `limit` | string | No | Maximum number of results (default: `10`) |
| `mode` | string | No | `hybrid` (default), `semantic`, or `keyword` |

Use `hybrid` for general queries. Use `keyword` when searching for exact names, IDs, or technical terms.

---

#### `get_memories`

List memories in chronological order. Use when you want to browse all stored memories rather than search by relevance.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | No | Filter by user ID |
| `agent_id` | string | No | Filter by agent ID |
| `page` | string | No | Page number (default: `1`) |
| `limit` | string | No | Results per page (default: `20`) |

---

#### `get_memory`

Retrieve a single memory by its ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `memory_id` | string | Yes | ID of the memory to retrieve |

---

#### `update_memory`

Update the content or priority of an existing memory. Prefer this over creating a duplicate when the user corrects or refines information that is already stored.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `memory_id` | string | Yes | ID of the memory to update |
| `memory` | string | No | New content |
| `priority` | string | No | New priority: `LOW`, `MEDIUM`, or `HIGH` |

---

#### `delete_memory`

Permanently delete a memory. Use when the user explicitly asks to forget something, or when a memory is clearly outdated. Search first if you do not have the ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `memory_id` | string | Yes | ID of the memory to delete |

---

#### `promote_memory`

Promote a temporary memory to permanent status. Memories stored as task-scoped (with an expiration) can be made permanent with this tool when the context proves to be persistently relevant.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `memory_id` | string | Yes | ID of the memory to promote |

---

#### `submit_feedback`

Submit quality feedback on a memory. Positive and negative signals improve memory quality over time.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `memory_id` | string | Yes | ID of the memory to rate |
| `signal` | string | Yes | `POSITIVE`, `NEGATIVE`, or `NEUTRAL` |
| `comment` | string | No | Optional explanation of the feedback |

---

#### `get_memory_history`

Retrieve the full event history of a memory: creation, updates, promotions, and feedback signals. Use to understand how a memory evolved or diagnose unexpected behavior.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `memory_id` | string | Yes | ID of the memory |
| `limit` | string | No | Maximum number of events (default: `20`) |

---

### Knowledge Tools

These tools require a plan that includes Knowledge Graph access (Pro or above).

#### `get_knowledge`

Get the consolidated knowledge profile built from processed memories. Set `merged=true` (the default) to receive a complete Markdown profile. Set `merged=false` to paginate through individual knowledge entries.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | No | Filter knowledge by user |
| `category` | string | No | Filter by knowledge category |
| `merged` | string | No | `true` (default) for a merged Markdown profile, `false` for paginated entries |

Call this at the start of a conversation to load the full context profile for a user before responding.

---

#### `get_knowledge_entry`

Retrieve a specific knowledge entry by ID, including the source memory IDs that contributed to it.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `knowledge_id` | string | Yes | ID of the knowledge entry |

---

### Graph Tools

These tools require a plan that includes Knowledge Graph access (Pro or above).

#### `graph_search`

Search for entities in the knowledge graph. Entities include people, organizations, places, and things mentioned across memories.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Text query to search for entities |
| `user_id` | string | No | Filter entities by user |
| `type` | string | No | `PERSON`, `ORGANIZATION`, `PLACE`, or `THING` |
| `limit` | string | No | Maximum number of results (default: `10`) |

---

#### `graph_traverse`

Navigate relationships starting from a known entity. Useful for exploring who an entity is connected to — colleagues, projects, organizations. Use `graph_search` first if you need to find the entity ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `entity_id` | string | Yes | ID of the starting entity |
| `direction` | string | No | `outgoing`, `incoming`, or `both` (default: `both`) |
| `hops` | string | No | Traversal depth between 1 and 3 (default: `2`) |

---

#### `graph_query`

Answer a natural language question using the knowledge graph. Returns an answer with a confidence score and the entities used to construct it.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `question` | string | Yes | Natural language question (e.g., "What projects is João involved in?") |

---

### Utility Tools

These tools are available on all plans that include MCP access.

#### `get_dashboard_summary`

Get workspace KPIs — total memories stored, searches performed, and tokens consumed — with a comparison to the previous period.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `days` | string | No | Time window in days (default: `30`) |

---

#### `get_memory_profile`

Get a summarized profile of a user built from their stored memories: key topics, entity count, and a narrative summary.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | Yes | ID of the user to profile |

---

#### `list_entities`

List all users and agents in the workspace with their memory counts. Use to discover who has memories stored or to compare activity across entities.

This tool takes no parameters.

---

## Resources

Resources are read-only data endpoints that MCP clients can load as context. They are accessible via URI.

| URI | Name | Description | MIME Type |
|---|---|---|---|
| `memsolus://workspace/summary` | Workspace Summary | KPIs and current workspace state | `application/json` |
| `memsolus://knowledge/merged` | Merged Knowledge | Complete merged knowledge base in Markdown | `application/json` |
| `memsolus://memory/{id}` | Memory by ID | Single memory retrieved by its ID | `application/json` |
| `memsolus://entities` | Entities | All users and agents with memory counts | `application/json` |

`memsolus://knowledge/merged` is only available on plans with Knowledge Graph access.

---

## Prompts

Prompts are pre-built interaction templates that combine tool calls with structured output. Clients that support MCP prompts can invoke them by name.

### `recall-context`

Retrieve and format relevant context before starting a task. Searches memories and loads the knowledge profile for a given topic, returning both in a single response.

| Argument | Required | Description |
|---|---|---|
| `topic` | Yes | Topic to search for in stored memories |

---

### `session-handoff`

Save relevant context at the end of a session. Stores the provided summary as a high-priority persistent memory so it is available in future conversations.

| Argument | Required | Description |
|---|---|---|
| `summary` | Yes | Summary of what was accomplished in the session |

---

### `decision-log`

Record a decision as a high-priority persistent memory, including the alternatives that were considered and the reasoning behind the final choice.

| Argument | Required | Description |
|---|---|---|
| `decision` | Yes | The decision that was made |
| `alternatives` | No | Alternative options that were considered |
| `reason` | No | Justification for why this option was chosen |

---

## Plan-Based Tool Availability

The server checks your plan entitlements at startup and registers only the tools your plan includes. This is done automatically — you do not need to configure anything.

| Feature set | Tools included | Required plan |
|---|---|---|
| Memory | `add_memory`, `search_memories`, `get_memories`, `get_memory`, `update_memory`, `delete_memory`, `promote_memory`, `submit_feedback`, `get_memory_history` | Any plan with MCP access |
| Utilities | `get_dashboard_summary`, `get_memory_profile`, `list_entities` | Any plan with MCP access |
| Knowledge + Graph | `get_knowledge`, `get_knowledge_entry`, `graph_search`, `graph_traverse`, `graph_query` | Pro plan or above |

If a tool does not appear in your client's tool list, it is because your current plan does not include that feature. Upgrade at [app.memsolus.com/settings/billing](https://app.memsolus.com/settings/billing).

If the server cannot reach the Memsolus API at startup to verify your entitlements, it registers all tools by default and lets the API enforce access. This prevents startup failures caused by temporary network issues.

---

## Examples

### Storing a decision

Tell your assistant:

> "Remember that we decided to use PostgreSQL instead of MongoDB for the user service. The reason was strong consistency requirements for financial transactions."

The assistant calls `add_memory` with priority `HIGH`, and the decision is stored as a permanent memory associated with your workspace.

---

### Searching past context

Ask your assistant:

> "What do you remember about our authentication architecture?"

The assistant calls `search_memories` with query `"authentication architecture"` in `hybrid` mode, retrieves ranked results, and summarizes what Memsolus knows on that topic.

---

### Exploring the knowledge graph

Ask your assistant:

> "Who are the main people involved in the billing module and how are they connected?"

The assistant calls `graph_search` to find entities related to the billing module, then calls `graph_traverse` on the most relevant entity to map its relationships. It can also use `graph_query` directly:

> "What projects is the backend team involved in?"

`graph_query` takes the natural language question, answers it using the knowledge graph, and returns the result with a confidence score.

---

### Loading context at the start of a conversation

For clients that support MCP prompts, invoke `recall-context` with the topic you are about to work on:

```
prompt: recall-context
arguments:
  topic: "billing refactor"
```

This runs a memory search and loads the full knowledge profile in a single step, giving the assistant the full context before it responds.

---

### Saving context at the end of a session

Invoke `session-handoff` before closing the conversation:

```
prompt: session-handoff
arguments:
  summary: "Reviewed billing module. Decided to split the invoice service into two microservices. Deferred payment retry logic to next sprint."
```

The summary is stored as a high-priority memory and will be available when you return.

---

## Troubleshooting

### Tools do not appear in my client

1. Confirm that `MEMSOLUS_API_KEY` is set and starts with `msk_`
2. Confirm that your plan includes MCP access — check [app.memsolus.com/settings/billing](https://app.memsolus.com/settings/billing)
3. Restart your MCP client after changing the config
4. On Claude Desktop, check `~/Library/Logs/Claude/` for server startup errors

### Knowledge and graph tools are missing

These tools require a Pro plan or above. If you are on a free or starter plan, only memory and utility tools are registered. Upgrade at [app.memsolus.com/settings/billing](https://app.memsolus.com/settings/billing).

### `UNAUTHORIZED` error when calling a tool

Your API key is invalid or has expired. Generate a new key at [app.memsolus.com/settings/api-keys](https://app.memsolus.com/settings/api-keys) and update your config.

### `ENTITLEMENT_NOT_AVAILABLE` error

The tool or feature you are trying to use is not included in your plan. The server registered the tool because entitlements could not be confirmed at startup, but the API rejected the call. Upgrade your plan or check that your API key belongs to the correct workspace.

### `RATE_LIMIT` error

You have exceeded the request rate for your plan. Wait a few seconds and retry. If you are hitting rate limits consistently, consider batching calls or upgrading to a plan with higher limits.

### The server fails to start with `MEMSOLUS_API_KEY environment variable is required`

The environment variable is not visible to the MCP server process. Make sure the `env` block in your client config includes the key explicitly, or that the variable is exported in the shell environment that launches your client.

---

## Related Packages

- **TypeScript SDK**: [@memsolus/sdk](https://github.com/memsolus/sdk-typescript) — programmatic access to the Memsolus API
- **Claude Code Plugin**: [memsolus/claude-plugin](https://github.com/memsolus/claude-plugin) — deeper Claude Code integration
- **Documentation**: [docs.memsolus.com](https://docs.memsolus.com)
- **Website**: [memsolus.com](https://memsolus.com)

---

## License

MIT
