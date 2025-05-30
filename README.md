# Lansweeper MCP Server (Experimental)

An experimental MCP (Model Context Protocol) server for querying the Lansweeper API.

## Prerequisites

- Node.js (v16 or later)
- Lansweeper account with API access
- Lansweeper Personal Access Token - follow the instructions in the [Lansweeper Data API documentation](https://developer.lansweeper.com/docs/data-api/get-started/quickstart#personal-access-token-pat) to generate your token

## Installation

### Cursor

Add the following to your Cursor MCP config:

```json
{
  "mcpServers": {
    "lansweeper-mcp-server": {
      "command": "npx",
      "args": ["-y", "@lansweeper-public/mcp-server-lansweeper"],
      "env": {
        "LANSWEEPER_PERSONAL_ACCESS_TOKEN": "your-lansweeper-token"
      }
    }
  }
}
```

### VS Code

To install Lansweeper MCP Server for VS Code, add the following to your `.vscode/mcp.json` file:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "lansweeper-token",
      "description": "Lansweeper Personal Access Token",
      "password": true
    }
  ],
  "servers": {
    "lansweeper-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@lansweeper-public/mcp-server-lansweeper"],
      "env": {
        "LANSWEEPER_PERSONAL_ACCESS_TOKEN": "${input:lansweeper-token}"
      }
    }
  }
}
```

### Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lansweeper-mcp-server": {
      "command": "npx",
      "args": ["-y", "@lansweeper-public/mcp-server-lansweeper"],
      "env": {
        "LANSWEEPER_PERSONAL_ACCESS_TOKEN": "your-lansweeper-token"
      }
    }
  }
}
```

This file is located at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

After installing Claude Code, run the following command:

```bash
claude mcp add lansweeper-mcp-server -e LANSWEEPER_PERSONAL_ACCESS_TOKEN=your-lansweeper-token -- npx -y @lansweeper-public/mcp-server-lansweeper
```

### Direct Usage

You can also run the server directly using npx:

```bash
LANSWEEPER_PERSONAL_ACCESS_TOKEN=your-lansweeper-token npx -y @lansweeper-public/mcp-server-lansweeper
```

## Available Tools

The MCP server provides the following tools:

1. `get-asset-details`: Get detailed information about a specific asset
2. `get-authorized-sites`: Get information about authorized sites
3. `get-assets-resources`: Get information about all assets in a site

## Development

For development of this package:

1. Clone this repository
2. Install dependencies:

```bash
yarn install
```

3. Build the project:

```bash
yarn build
```

4. Run in development mode:

```bash
yarn dev
```

## License

Server Side Public License v1 (SSPL v1)
