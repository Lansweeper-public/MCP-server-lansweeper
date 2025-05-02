#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import tool schemas and handlers using the index files
import {
  getAssetDetailsHandler,
  getAssetDetailsSchema,
  getAssetsHandler,
  getAssetsSchema,
  getSitesHandler,
  getSitesSchema,
  searchAssetsHandler,
  searchAssetsSchema,
} from "./tools/index.js";

// Create server instance
const server = new McpServer({
  name: "mcp-server-lansweeper",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register Lansweeper tools
server.tool("get-assets", "Get assets from Lansweeper", getAssetsSchema, getAssetsHandler);
server.tool(
  "get-asset-details",
  "Get detailed information about a specific asset",
  getAssetDetailsSchema,
  getAssetDetailsHandler,
);
server.tool(
  "search-assets",
  "Search for assets by name, IP address, or other criteria",
  searchAssetsSchema,
  searchAssetsHandler,
);
server.tool("get-sites", "Get list of Lansweeper sites", getSitesSchema, getSitesHandler);

// Export a function to start the server
export async function startServer(): Promise<void> {
  // Check for environment variable at startup
  if (!process.env.LANSWEEPER_PERSONAL_ACCESS_TOKEN) {
    console.error("Error: LANSWEEPER_PERSONAL_ACCESS_TOKEN environment variable is not set");
    console.error("Please set the environment variable before starting the server:");
    console.error("  export LANSWEEPER_PERSONAL_ACCESS_TOKEN=your_token_here");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lansweeper MCP Server running on stdio");
}

startServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
