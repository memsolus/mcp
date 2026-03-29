# @memsolus/mcp

**Persistent memory for AI agents. One line to install, zero config to remember everything.**

Give your AI agents the ability to store, recall, and reason over long-term memory — preferences, facts, decisions, relationships, and structured knowledge — across conversations and sessions.

Built on the [Model Context Protocol](https://modelcontextprotocol.io), works with Claude, GPT, and any MCP-compatible client.

---

## Why Memsolus?

- **Semantic search** — Find memories by meaning, not just keywords. Hybrid search combines both for best results.
- **Knowledge graph** — Entities and relationships are automatically extracted. Ask "Who works on Project X?" and get structured answers.
- **Auto-consolidation** — Raw memories are processed into structured knowledge profiles, versioned and categorized.
- **Memory pools** — Shared memory spaces for teams and multi-agent collaboration.
- **Priority-aware** — Mark critical rules as HIGH priority. They rank higher in search and resist pruning.
- **Multi-tenant** — Isolate context per user, agent, or workspace. Fine-grained scoping built in.

---

## Setup

Get your API key at [app.memsolus.com/api-keys](https://app.memsolus.com/api-keys), then add the server to your tool:

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "mk_live_..."
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add memsolus -- npx -y @memsolus/mcp
```

Then set your key in `.claude/settings.local.json`:

```json
{
  "env": {
    "MEMSOLUS_API_KEY": "mk_live_..."
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "mk_live_..."
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "mk_live_..."
      }
    }
  }
}
```

### VS Code (Copilot)

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "mk_live_..."
      }
    }
  }
}
```

### Zed

Add to Zed settings (`Cmd+,` > `assistant` > `mcp`):

```json
{
  "context_servers": {
    "memsolus": {
      "command": {
        "path": "npx",
        "args": ["-y", "@memsolus/mcp"],
        "env": {
          "MEMSOLUS_API_KEY": "mk_live_..."
        }
      }
    }
  }
}
```

### Any MCP-compatible client

The server runs over **stdio** by default. Point your client to:

```bash
npx -y @memsolus/mcp
```

With the environment variable `MEMSOLUS_API_KEY` set.

---

## What your agent can do

| Capability | Tools |
|---|---|
| **Store & retrieve** | `add_memory`, `get_memory`, `get_memories`, `update_memory`, `delete_memory` |
| **Semantic search** | `search_memories` — hybrid, semantic, or keyword mode |
| **Knowledge profiles** | `get_knowledge` — auto-compiled from memories, merged as Markdown |
| **Shared pools** | `list_pools`, `add_memory_to_pool`, `search_pool` |
| **Knowledge graph** | `graph_search`, `graph_traverse`, `graph_query` |
| **Housekeeping** | `list_entities`, `delete_all_memories` |

15 tools total. All exposed automatically via MCP.

---

## Use Cases

- **Personalized assistants** — Remember user preferences, past decisions, and context across sessions
- **Multi-agent systems** — Shared memory pools let agents collaborate with common context
- **Knowledge management** — Auto-extract entities and relationships from unstructured text
- **Customer support** — Recall full interaction history and customer preferences instantly
- **Research agents** — Accumulate findings across sessions, search by concept

---

## Self-Hosting

If you're running your own Memsolus API instance, use the `MEMSOLUS_API_URL` variable to point to it:

```json
{
  "mcpServers": {
    "memsolus": {
      "command": "npx",
      "args": ["-y", "@memsolus/mcp"],
      "env": {
        "MEMSOLUS_API_KEY": "mk_live_...",
        "MEMSOLUS_API_URL": "https://your-instance.example.com"
      }
    }
  }
}
```

---

## Programmatic Usage

```typescript
import { createServer } from '@memsolus/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = createServer({
  baseUrl: 'https://api.memsolus.com',
  apiKey: process.env.MEMSOLUS_API_KEY,
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `MEMSOLUS_API_KEY` | Yes | — | Your API key ([get one](https://app.memsolus.com/api-keys)) |
| `MEMSOLUS_API_URL` | No | `https://api.memsolus.com` | API base URL (for self-hosting) |

---

## Links

- [Website](https://memsolus.com)
- [Documentation](https://docs.memsolus.com)
- [API Reference](https://api.memsolus.com/docs)
- [Get API Key](https://app.memsolus.com/api-keys)

## License

MIT
