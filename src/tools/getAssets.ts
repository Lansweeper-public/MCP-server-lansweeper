import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define interfaces for the GraphQL response
interface AssetBasicInfo {
  ipAddress?: string;
  operatingSystem?: string;
  lastSeen?: string;
  manufacturer?: string;
  model?: string;
}

interface AssetNode {
  id: string;
  key: string;
  name: string;
  assetBasicInfo?: AssetBasicInfo;
}

interface AssetEdge {
  node: AssetNode;
}

interface AssetsData {
  assets: {
    edges: AssetEdge[];
  };
}

interface Asset {
  id: string;
  key: string;
  name: string;
  ipAddress?: string;
  operatingSystem?: string;
  lastSeen?: string;
  manufacturer?: string;
  model?: string;
}

// Define the schema for the tool parameters
export const getAssetsSchema = {
  limit: z.number().optional().describe("Maximum number of assets to return (default: 10)"),
  filter: z.string().optional().describe("Filter expression (GraphQL filter syntax)"),
};

// Implementation of the get-assets tool
export const getAssetsHandler = async ({
  limit = 10,
  filter,
}: z.infer<
  z.ZodSchema<{
    limit?: number;
    filter?: string;
  }>
>): Promise<CallToolResult> => {
  // Build GraphQL query
  const query = `
    query GetAssets {
      assets(first: ${limit}${filter ? `, filter: ${filter}` : ""}) {
        edges {
          node {
            id
            key
            name
            assetBasicInfo {
              ipAddress
              operatingSystem
              lastSeen
              manufacturer
              model
            }
          }
        }
      }
    }
  `;

  try {
    const client = createGraphQLClient();
    const data = await client.request<AssetsData>(query);

    // Process and format the response
    const assets: Asset[] = data.assets.edges.map((edge: AssetEdge) => {
      const asset = edge.node;
      return {
        id: asset.id,
        key: asset.key,
        name: asset.name,
        ipAddress: asset.assetBasicInfo?.ipAddress,
        operatingSystem: asset.assetBasicInfo?.operatingSystem,
        lastSeen: asset.assetBasicInfo?.lastSeen,
        manufacturer: asset.assetBasicInfo?.manufacturer,
        model: asset.assetBasicInfo?.model,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(assets, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
};
