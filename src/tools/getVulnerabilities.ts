import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define the schema for the tool parameters
export const getVulnerabilitiesSchema = {
  siteId: z.string().describe("ID of the site to query for vulnerabilities"),
  cursor: z.string().optional().describe("Pagination cursor for subsequent requests"),
  fields: z
    .array(z.string())
    .optional()
    .describe(
      "Optional list of specific fields to request. Available options: 'basic' (source, updatedOn, publishedOn), 'technical' (attackVector, attackComplexity, etc.), 'assets' (assetKeys), 'references' (references with url and tags), 'cause' (category, affectedProduct, vendor), or 'all' (includes all fields). If not provided, 'basic' and 'technical' will be used by default.",
    ),
};

// Vulnerabilities pagination type for GraphQL query
type VulnerabilitiesPagination = {
  limit?: number;
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
  cursor = "",
  fields = [], // Default to empty array if not provided
}: z.infer<
  z.ZodSchema<{
    siteId: string;
    cursor?: string;
    fields?: string[];
  }>
>): Promise<CallToolResult> => {
  try {
    const client = createGraphQLClient();

    // Define default fields to query if none specified
    const defaultFields = ["basic", "technical"];

    // Use user-specified fields or defaults
    const fieldsToQuery = fields.length > 0 ? fields : defaultFields;

    const pagination: VulnerabilitiesPagination = {
      cursor,
      page: cursor ? "NEXT" : "FIRST",
    };

    // Build dynamic query based on requested fields
    const buildFieldQuery = (field: string): string => {
      switch (field) {
        case "basic":
          return `
          source
          updatedOn
          publishedOn
        `;
        case "technical":
          return `
          attackVector
          attackComplexity
          availabilityImpact
          baseScore
          confidentiality
          integrity
          privilegeRequired
          scope
          userInteraction
          weaknessEnumeration
        `;
        case "assets":
          return `assetKeys`;
        case "references":
          return `
          references {
            url
            tags
          }
        `;
        case "cause":
          return `
          cause {
            category
            affectedProduct
            vendor
          }
        `;
        case "all":
          // Include all fields
          return `
          source
          updatedOn
          publishedOn
          attackVector
          attackComplexity
          availabilityImpact
          baseScore
          confidentiality
          integrity
          privilegeRequired
          scope
          userInteraction
          weaknessEnumeration
          assetKeys
          references {
            url
            tags
          }
          cause {
            category
            affectedProduct
            vendor
          }
        `;
        default:
          return "";
      }
    };

    // Build the fields part of the query
    const buildFieldsQuery = (): string => {
      // Core fields always included
      const coreFields = `
        cve
        riskScore
        severity
        isActive
      `;

      // Add requested fields
      const additionalFields = fieldsToQuery
        .map(buildFieldQuery)
        .filter((field) => field !== "") // Filter out empty strings
        .join("\n");

      return `${coreFields}${additionalFields}`;
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
              ${buildFieldsQuery()}
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
      nextCursor:
        typedResponse.site.vulnerabilities.items.length > 0 ? typedResponse.site.vulnerabilities.pagination.next : null,
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
