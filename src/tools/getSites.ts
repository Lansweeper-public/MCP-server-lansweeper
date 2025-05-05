import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define interfaces for the GraphQL response
interface SiteNode {
  id: string;
  name: string;
  url: string;
  clientId: string;
}

interface SiteEdge {
  node: SiteNode;
}

interface GetSitesData {
  sites: {
    edges: SiteEdge[];
  };
}

interface Site {
  id: string;
  name: string;
  url: string;
  clientId: string;
}

// Define the schema for the tool parameters
export const getSitesSchema = {
  limit: z.number().optional().describe("Maximum number of sites to return (default: 100)"),
};

// Implementation of the get-sites tool
export const getSitesHandler = async ({
  limit = 100,
}: z.infer<
  z.ZodSchema<{
    limit?: number;
  }>
>): Promise<CallToolResult> => {
  // Build GraphQL query
  const query = `
    query GetSites {
      sites(first: ${limit}) {
        edges {
          node {
            id
            name
            url
            clientId
          }
        }
      }
    }
  `;

  try {
    const client = createGraphQLClient();
    const data = await client.request<GetSitesData>(query);

    // Process and format the response
    const sites: Site[] = data.sites.edges.map((edge: SiteEdge) => {
      const site = edge.node;
      return {
        id: site.id,
        name: site.name,
        url: site.url,
        clientId: site.clientId,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(sites, null, 2),
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
