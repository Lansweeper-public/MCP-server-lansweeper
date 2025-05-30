import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// TypeScript interfaces for asset resource response
interface AssetResourcePagination {
  limit: number;
  current: string | null;
  next: string | null;
  page: string;
}

interface AssetResourcesResponse {
  items: any[]; // The actual asset data structure varies based on requested fields
  pagination: AssetResourcePagination;
  total: number;
}

interface SiteAssetResourcesResponse {
  site: {
    assetResources: AssetResourcesResponse;
  };
}

// AssetsFilterType enum - all available filter operators
const AssetsFilterTypeEnum = z.enum([
  "EQUAL",
  "NOT_EQUAL",
  "SMALLER_THAN",
  "SMALLER_THAN_OR_EQUAL",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "IN",
  "NOT_IN",
  "LIKE",
  "NOT_LIKE",
  "IS_NULL",
  "IS_NOT_NULL",
  "STARTS_WITH",
  "NOT_STARTS_WITH",
  "ENDS_WITH",
  "NOT_ENDS_WITH",
  "CONTAINS",
  "NOT_CONTAINS",
]);

// AssetsFilterConjunction enum - logical operators
const AssetsFilterConjunctionEnum = z.enum(["AND", "OR"]);

// AssetsFiltersCondition - individual filter condition
const AssetsFiltersConditionSchema = z.object({
  operator: AssetsFilterTypeEnum.describe("The filter operator to apply"),
  path: z.string().describe("The field path to filter on (e.g., 'assetBasicInfo.name', 'assetBasicInfo.type')"),
  value: z.string().describe("The value to filter by"),
});

// Type definition for recursive filter structure
type AssetsFilterGroupedInputType = {
  conditions?: Array<z.infer<typeof AssetsFiltersConditionSchema>>;
  conjunction?: z.infer<typeof AssetsFilterConjunctionEnum>;
  groups?: Array<AssetsFilterGroupedInputType>;
};

// AssetsFilterGroupedInput - recursive filter structure
const AssetsFilterGroupedInputSchema: z.ZodType<AssetsFilterGroupedInputType> = z.lazy(() =>
  z.object({
    conditions: z.array(AssetsFiltersConditionSchema).optional().describe("Array of filter conditions to apply"),
    conjunction: AssetsFilterConjunctionEnum.optional().describe(
      "Logical operator to combine conditions and groups (default: AND)",
    ),
    groups: z.array(AssetsFilterGroupedInputSchema).optional().describe("Nested filter groups for complex filtering"),
  }),
);

// Export types for TypeScript usage
export type AssetsFilterType = z.infer<typeof AssetsFilterTypeEnum>;
export type AssetsFilterConjunction = z.infer<typeof AssetsFilterConjunctionEnum>;
export type AssetsFiltersCondition = z.infer<typeof AssetsFiltersConditionSchema>;
export type AssetsFilterGroupedInput = AssetsFilterGroupedInputType;

// Define the schema for the tool parameters
export const getAssetsResourcesSchema = {
  siteId: z.string().describe("ID of the site containing the assets"),
  limit: z.number().optional().describe("Maximum number of assets to return (default: 10)"),
  filters: AssetsFilterGroupedInputSchema.optional().describe(
    "Structured filter object with conditions, conjunctions, and nested groups",
  ),
  fields: z
    .array(z.string())
    .optional()
    .describe(
      "Optional list of specific fields or field groups to request. If not provided, all default groups will be used. " +
        "Available field groups: 'basic', 'network', 'time', 'hardware', 'location', 'operating_system', 'custom_fields', 'state', 'relationships'. " +
        "You can also provide specific individual fields like 'key' or 'assetBasicInfo.name'.",
    ),
  cursor: z.string().optional().describe("Cursor for pagination"),
};

// Implementation of the get-assets-resources tool
export const getAssetsResourcesHandler = async ({
  siteId,
  limit = 10,
  filters,
  fields = [],
  cursor,
}: z.infer<
  z.ZodSchema<{
    siteId: string;
    limit?: number;
    filters?: AssetsFilterGroupedInput;
    fields?: string[];
    cursor?: string;
  }>
>): Promise<CallToolResult> => {
  // Define default fields to query if none specified
  const defaultFields = ["basic"];

  // Build dynamic query based on requested fields
  const buildFieldQuery = (field: string): string[] => {
    switch (field) {
      case "basic":
        return [
          "key",
          "assetBasicInfo.name",
          "assetBasicInfo.domain",
          "assetBasicInfo.type",
          "assetBasicInfo.subType",
          "assetBasicInfo.typeGroup",
          "installationId",
        ];
      case "network":
        return ["assetBasicInfo.ipAddress", "assetBasicInfo.mac", "assetBasicInfo.fqdn"];
      case "time":
        return ["assetBasicInfo.firstSeen", "assetBasicInfo.lastSeen", "assetBasicInfo.lastUpdated"];
      case "hardware":
        return ["assetCustom.manufacturer", "assetCustom.model", "assetCustom.serialNumber"];
      case "location":
        return ["assetCustom.location", "assetCustom.department", "assetCustom.comment"];
      case "operating_system":
        return ["operatingSystem.caption", "operatingSystem.version", "operatingSystem.buildNumber"];
      case "custom_fields":
        return ["assetCustom.fields.fieldKey", "assetCustom.fields.name", "assetCustom.fields.value"];
      case "state":
        return ["assetCustom.stateName"];
      case "relationships":
        return ["reconciliations.sourceId", "relations.childAssetKey", "relations.parentAssetKey", "relations.name"];
      default:
        // If it's a raw field name, return it directly
        return [field];
    }
  };

  // Use user-specified fields or defaults, and expand them using buildFieldQuery
  const fieldsToQuery = fields.length > 0 ? fields.flatMap(buildFieldQuery) : defaultFields.flatMap(buildFieldQuery);

  // Prepare pagination object
  const pagination: any = { limit };
  if (cursor) {
    pagination.cursor = cursor;
    pagination.page = "NEXT";
  } else {
    pagination.page = "FIRST";
  }

  // Prepare variables for GraphQL query
  const variables: any = {
    siteId,
    fields: fieldsToQuery,
    assetPagination: pagination,
  };

  // Only add filters if provided
  if (filters) {
    try {
      variables.filters = filters;
    } catch (error) {
      throw new Error(`Invalid filters JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Build GraphQL query with variables
  const query = `
    query GetAssetsResources(
      $siteId: String!
      $fields: [String!]!
      $assetPagination: AssetPaginationInput
      $filters: FilterInput
    ) {
      site(id: $siteId) {
        assetResources(
          fields: $fields
          assetPagination: $assetPagination
          filters: $filters
        ) {
          items
          pagination {
            limit
            current
            next
            page
          }
          total
        }
      }
    }
  `;

  try {
    const client = createGraphQLClient();
    const response = await client.request<SiteAssetResourcesResponse>(query, variables);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
      nextCursor: response.site.assetResources.pagination.next || undefined,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error fetching asset resources: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
};
