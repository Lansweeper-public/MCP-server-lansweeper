#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "node:crypto";
import express from "express";

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
const version = packageJson.version;

// Import tool schemas and handlers using the index files
import {
  getAssetDetailsHandler,
  getAssetDetailsSchema,
  getAssetsResourcesHandler,
  getAssetsResourcesSchema,
  getAuthorizedSitesHandler,
  getAuthorizedSitesSchema,
} from "./tools/index.js";

// Create server instance factory
const createServer = () => {
  const server = new McpServer({
    name: "mcp-server-lansweeper",
    version,
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

  return server;
};

// HTTP server implementation
async function startHttpServer(): Promise<void> {
  const app = express();
  app.use(express.json());

  // Map to store transports by session ID
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.post("/mcp", async (req, res) => {
    console.log("Received MCP request:", req.body);
    try {
      // Check for existing session ID
      const sessionId = req.headers["mcp-session-id"] as string;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId: string) => {
            console.log(`Session initialized with ID: ${sessionId}`);
            transports[sessionId] = transport;
          },
        });

        // Set up onclose handler to clean up transport when closed
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            console.log(`Transport closed for session ${sid}, removing from transports map`);
            delete transports[sid];
          }
        };

        // Connect the transport to the MCP server
        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      // Handle the request with existing transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  // Handle GET requests for SSE streams
  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  });

  // Handle DELETE requests for session termination
  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    console.log(`Received session termination request for session ${sessionId}`);
    try {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling session termination:", error);
      if (!res.headersSent) {
        res.status(500).send("Error processing session termination");
      }
    }
  });

  const PORT = process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT) : 3000;
  app.listen(PORT, () => {
    console.log(`Lansweeper MCP Server listening on HTTP port ${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/mcp`);
  });

  // Handle server shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down HTTP server...");
    for (const sessionId in transports) {
      try {
        console.log(`Closing transport for session ${sessionId}`);
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
    }
    console.log("HTTP server shutdown complete");
    process.exit(0);
  });
}

// Stdio server implementation
async function startStdioServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Lansweeper MCP Server running on stdio");
}

// Main server startup function
async function startServer(): Promise<void> {
  // Check for environment variable at startup
  if (!process.env.LANSWEEPER_PERSONAL_ACCESS_TOKEN) {
    console.error("Error: LANSWEEPER_PERSONAL_ACCESS_TOKEN environment variable is not set");
    console.error("Please set the environment variable before starting the server:");
    console.error("  export LANSWEEPER_PERSONAL_ACCESS_TOKEN=your_token_here");
    process.exit(1);
  }

  // Check transport mode from environment variable
  const transportMode = process.env.MCP_TRANSPORT_MODE || "stdio";

  if (transportMode === "http") {
    await startHttpServer();
  } else if (transportMode === "stdio") {
    await startStdioServer();
  } else {
    console.error(`Error: Invalid MCP_TRANSPORT_MODE: ${transportMode}. Valid values are 'stdio' or 'http'`);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
