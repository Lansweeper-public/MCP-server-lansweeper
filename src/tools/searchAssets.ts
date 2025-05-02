import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient";

// Define interfaces for the GraphQL response
interface AssetBasicInfo {
  ipAddress?: string;
  operatingSystem?: string;
  lastSeen?: string;
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

interface SearchAssetsData {
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
}

// Define the schema for the tool parameters
export const searchAssetsSchema = {
  query: z.string().describe("Search query text"),
  limit: z.number().optional().describe("Maximum number of results to return (default: 10)"),
};

// Define the type for the schema parameters
export type SearchAssetsParams = {
  query: string;
  limit?: number;
};

// Implementation of the search-assets tool
export const searchAssetsHandler = async ({ query, limit = 10 }: SearchAssetsParams) => {
  // Build GraphQL query
  const gqlQuery = `
    query SearchAssets {
      assets(first: ${limit}, filter: {name: {contains: "${query}"}}) {
        edges {
          node {
            id
            key
            name
            assetBasicInfo {
              ipAddress
              operatingSystem
              lastSeen
            }
          }
        }
      }
    }
  `;

  try {
    const client = createGraphQLClient();
    const data = await client.request<SearchAssetsData>(gqlQuery);

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
