#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
const version = packageJson.version;

// Import tool schemas and handlers using the index files
import {
  getAssetDetailsHandler,
  getAssetDetailsSchema,
  getAuthorizedSitesHandler,
  getAuthorizedSitesSchema,
  // getAssetsHandler,
  // getAssetsSchema,
  // getSitesHandler,
  // getSitesSchema,
  // searchAssetsHandler,
  // searchAssetsSchema,
} from "./tools/index.js";

// Create server instance
const server = new McpServer({
  name: "mcp-server-lansweeper",
  version,
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register Lansweeper tools
server.tool(
  "get-asset-details",
  "Get detailed information about a specific asset",
  getAssetDetailsSchema,
  getAssetDetailsHandler,
);
server.tool(
  "get-assets-resources",
  "Get asset resources from a Lansweeper site",
  getAssetsResourcesSchema,
  getAssetsResourcesHandler,
);

server.tool(
  "get-authorized-sites",
  "Get information about authorized sites",
  getAuthorizedSitesSchema.shape,
  getAuthorizedSitesHandler,
);

// Export a function to start the server
async function startServer(): Promise<void> {
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
