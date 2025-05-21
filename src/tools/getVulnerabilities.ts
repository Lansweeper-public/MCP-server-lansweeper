import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define the schema for the tool parameters
export const getVulnerabilitiesSchema = {
  siteId: z.string().describe("ID of the site to query for vulnerabilities"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .describe("Maximum number of vulnerabilities to return (max: 100)"),
  cursor: z.string().optional().describe("Pagination cursor for subsequent requests"),
};

// Vulnerabilities pagination type for GraphQL query
type VulnerabilitiesPagination = {
  limit: number;
  cursor: string;
  page?: "FIRST" | "NEXT";
};

// Define the expected structure of the response
interface VulnerabilitiesResponse {
  site: {
    vulnerabilities: {
      pagination: {
        next: string;
      };
      items: Array<{
        cve: string;
        riskScore: number;
        severity: string;
        assetKeys: string[];
        attackVector: string;
        attackComplexity: string;
        source: string;
        updatedOn: string;
        availabilityImpact: string;
        baseScore: number;
        confidentiality: string;
        integrity: string;
        privilegeRequired: string;
        publishedOn: string;
        scope: string;
        userInteraction: string;
        weaknessEnumeration: string;
        references: Array<{
          url: string;
          tags: string[];
        }>;
        isActive: boolean;
        cause: {
          category: string;
          affectedProduct: string;
          vendor: string;
        };
      }>;
    };
  };
}

// Implementation of the get-vulnerabilities tool
export const getVulnerabilitiesHandler = async ({
  siteId,
  limit = 100,
  cursor = "",
}: z.infer<
  z.ZodSchema<{
    siteId: string;
    limit?: number;
    cursor?: string;
  }>
>): Promise<CallToolResult> => {
  try {
    const client = createGraphQLClient();

    const pagination: VulnerabilitiesPagination = {
      limit,
      cursor,
      page: cursor ? "NEXT" : "FIRST",
    };

    const query = `
      query GetSiteVulnerabilities($siteId: ID!, $pagination: AssetsPaginationInputValidated!) {
        site(id: $siteId) {
          vulnerabilities(pagination: $pagination) {
            total
            pagination {
              limit
              current
              next
              page
            }
            items {
              cve
              riskScore
              severity
              assetKeys
              attackVector
              attackComplexity
              source
              updatedOn
              availabilityImpact
              baseScore
              confidentiality
              integrity
              privilegeRequired
              publishedOn
              scope
              userInteraction
              weaknessEnumeration
              references {
                url
                tags
              }
              isActive
              cause {
                category
                affectedProduct
                vendor
              }
            }
          }
        }
      }
    `;

    const variables = {
      siteId,
      pagination,
    };

    const response = await client.request(query, variables);

    // Cast the response to the expected type
    const typedResponse = response as VulnerabilitiesResponse;

    // Update the return object to include the next cursor for pagination
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(typedResponse, null, 2),
        },
      ],
      nextCursor: typedResponse.site.vulnerabilities.items.length
        ? typedResponse.site.vulnerabilities.pagination.next
        : null, // Include the next cursor
    };
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching vulnerabilities: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
};
