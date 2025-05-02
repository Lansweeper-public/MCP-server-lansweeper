import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define interfaces for the GraphQL response
interface AssetBasicInfo {
  ipAddress?: string;
  macAddress?: string;
  domain?: string;
  operatingSystem?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  lastSeen?: string;
  fqdn?: string;
}

interface AssetCustomField {
  name: string;
  value: string;
}

interface AssetSite {
  id: string;
  name: string;
}

interface AssetState {
  name: string;
}

interface AssetDetails {
  asset: {
    id: string;
    key: string;
    name: string;
    type: string;
    url: string;
    assetBasicInfo?: AssetBasicInfo;
    assetCustomFields?: AssetCustomField[];
    site?: AssetSite;
    state?: AssetState;
  };
}

// Define the schema for the tool parameters
export const getAssetDetailsSchema = {
  assetId: z.string().describe("ID of the asset to retrieve"),
};

// Implementation of the get-asset-details tool
export const getAssetDetailsHandler = async ({
  assetId,
}: z.infer<z.ZodSchema<{ assetId: string }>>): Promise<CallToolResult> => {
  // Build GraphQL query
  const query = `
    query GetAssetDetails {
      asset(id: "${assetId}") {
        id
        key
        name
        type
        url
        assetBasicInfo {
          ipAddress
          macAddress
          domain
          operatingSystem
          manufacturer
          model
          serialNumber
          lastSeen
          fqdn
        }
        assetCustomFields {
          name
          value
        }
        site {
          id
          name
        }
        state {
          name
        }
      }
    }
  `;

  try {
    const client = createGraphQLClient();
    const data = await client.request<AssetDetails>(query);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify([data.asset], null, 2),
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
