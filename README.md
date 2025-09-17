# Lansweeper MCP Server (Experimental)

An experimental MCP (Model Context Protocol) server for querying the Lansweeper API.

You can:

- Get detailed information about a specific asset
- Get asset resources from a Lansweeper site
- Get information about authorized sites

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

example of listing the tools:

```bash
 echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | yarn dev
```

### Running as HTTP Server

You can also run the server as an HTTP endpoint for direct integration:

```bash
# Run on custom port
LANSWEEPER_PERSONAL_ACCESS_TOKEN=your-lansweeper-token \
MCP_TRANSPORT_MODE=http \
MCP_HTTP_PORT=8080 \
npx -y @lansweeper-public/mcp-server-lansweeper
```

The HTTP server will be available at `http://localhost:8080/mcp` (or your specified port).

### Docker

You can run the MCP server as an HTTP endpoint using Docker:

#### Building the Docker image

```bash
docker build -t lansweeper-mcp-server .
```

#### Running as HTTP server

```bash
docker run -d --name lansweeper-mcp-server \
  -p 8080:8080 \
  -e LANSWEEPER_PERSONAL_ACCESS_TOKEN=your-lansweeper-token \
  lansweeper-mcp-server
```

The server will be available at `http://localhost:8080/mcp`

#### Using with MCP HTTP clients

The HTTP endpoint follows the MCP streamable HTTP transport specification. Configure your MCP client to connect to:

- **Endpoint**: `http://localhost:8080/mcp`
- **Method**: POST for requests, GET for Server-Sent Events
- **Headers**: Content-Type: application/json

#### Testing the server

You can test the server using curl:

```bash
 curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1, "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}'
```

> **Note**: The Docker container runs in HTTP mode by default. For stdio mode, set `MCP_TRANSPORT_MODE=stdio` environment variable.

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
