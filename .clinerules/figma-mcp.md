# Figma Console MCP Usage

Figma Console MCP bridges AI assistants to Figma for design extraction,
creation, debugging, and bidirectional token sync.

## MCP Configuration

Registered as a stdio MCP server running `figma-console-mcp@latest`.

### Prerequisites

1. **Figma access token** — get one at:
   https://www.figma.com/developers/api#access-tokens
   Set it in `.env.local` as `FIGMA_ACCESS_TOKEN`.

2. **Desktop Bridge Plugin** (for write operations):
   - Open Figma Desktop
   - Plugins → Development → Import plugin from manifest...
   - Select `~/.figma-console-mcp/plugin/manifest.json`
   - Run the plugin in your Figma file

### One-time CLI setup (already done)

```bash
FIGMA_ACCESS_TOKEN="figd_YOUR_TOKEN" \
ENABLE_MCP_APPS="true" \
cline mcp add figma-console --yes -- npx -y figma-console-mcp@latest
```

Config stored at `~/.cline/data/settings/cline_mcp_settings.json`.

### Capabilities

| Area | Tools |
|---|---|
| **Design extraction** | Pull variables, components, styles, tokens |
| **Bidirectional token sync** | Export Figma variables to DTCG JSON + 9 formats, push code-side edits back |
| **Visual debugging** | Take screenshots for context |
| **Design creation** | Create UI components, frames, layouts, component sets |
| **Variable management** | Create, update, rename, delete design tokens |
| **Version history** | List versions, diff snapshots, changelogs |
| **Real-time monitoring** | Watch console logs from Desktop Bridge |
| **FigJam boards** | Stickies, flowcharts, tables, code blocks |
| **Accessibility scanning** | 14 WCAG design checks |

## References

- `.env.local` — Figma token (gitignored)
- Docs: https://docs.figma-console-mcp.southleft.com
- Repo: https://github.com/southleft/figma-console-mcp
