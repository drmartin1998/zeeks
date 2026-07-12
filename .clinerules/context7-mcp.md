# Context7 MCP Server Usage

Context7 provides up-to-date library documentation for AI coding assistants.
Use it whenever you need current API docs, code examples, or setup guidance
for libraries, frameworks, or tools.

## MCP Configuration

Context7 is configured as a remote streamable HTTP MCP server.

### Project-level config (`.cline/mcp.json`)

This file stores the MCP server configuration template (without the API key).
Copy your API key from `.env.local` into it:

```json
{
  "mcpServers": {
    "context7": {
      "transport": {
        "type": "streamableHttp",
        "url": "https://mcp.context7.com/mcp",
        "headers": {
          "CONTEXT7_API_KEY": "<your-api-key-from-.env.local>"
        }
      }
    }
  }
}
```

### One-time CLI setup (already done)

The MCP server was registered globally via:

```bash
cline mcp add context7 --transport http \\
  https://mcp.context7.com/mcp \\
  --header "CONTEXT7_API_KEY: <your-api-key>" \\
  --yes
```

Config is stored at `~/.cline/data/settings/cline_mcp_settings.json`.

## Available Tools

| Tool | Purpose |
|---|---|
| `resolve-library-id` | Resolves a library name into a Context7-compatible ID (e.g., `/vercel/next.js`) |
| `query-docs` | Fetches documentation for a library using its Context7 ID |

## When to Use Context7

- Setting up new libraries or frameworks
- Writing code with unfamiliar APIs
- Needing current examples instead of relying on training data
- Checking version-specific API signatures

**Usage tip**: Explicitly invoke with `use context7` in your prompt, or
ask a question about a library and Context7 will auto-resolve.

## References

- `.env.local` — contains the API key (gitignored)
- https://context7.com — dashboard and docs
- https://mcp.context7.com/mcp — MCP server endpoint
