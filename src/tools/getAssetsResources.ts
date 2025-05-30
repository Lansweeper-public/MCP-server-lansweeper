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
  items: Record<string, unknown>[]; // The actual asset data structure varies based on requested fields
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

const reservedFilterPaths = [
  "assetBasicInfo.cloudCategory",
  "assetBasicInfo.cloudEnvId",
  "assetBasicInfo.cloudEnvName",
  "assetBasicInfo.cloudOrgId",
  "assetBasicInfo.cloudOrgName",
  "assetBasicInfo.cloudProvider",
  "assetBasicInfo.cloudRegion",
  "assetBasicInfo.cloudTags",
  "assetBasicInfo.description",
  "assetBasicInfo.domain",
  "assetBasicInfo.firstSeen",
  "assetBasicInfo.ipAddress",
  "assetBasicInfo.lastSeen",
  "assetBasicInfo.lastTried",
  "assetBasicInfo.lastUpdated",
  "assetBasicInfo.mac",
  "assetBasicInfo.name",
  "assetBasicInfo.origin",
  "assetBasicInfo.scannerTypes",
  "assetBasicInfo.subType",
  "assetBasicInfo.type",
  "assetBasicInfo.typeGroup",
  "assetBasicInfo.userName",
  "assetCustom.dnsName",
  "assetCustom.manufacturer",
  "assetCustom.model",
  "assetCustom.purchaseDate",
  "assetCustom.serialNumber",
  "assetCustom.stateName",
  "assetCustom.warrantyDate",
  "assetGroups.assetGroupKey",
  "assetGroups.name",
  "installKey",
  "installationId",
  "key",
  "otData.moduleType",
] as const;
const FilterPathsSchema = z.enum(reservedFilterPaths);

// AssetsFiltersCondition - individual filter condition
const AssetsFiltersConditionSchema = z.object({
  operator: AssetsFilterTypeEnum.describe("The filter operator to apply"),
  path: FilterPathsSchema.describe(
    `The field path to filter on. Available paths: 
        assetBasicInfo.cloudCategory, assetBasicInfo.cloudEnvId, assetBasicInfo.cloudEnvName, 
        assetBasicInfo.cloudOrgId, assetBasicInfo.cloudOrgName, assetBasicInfo.cloudProvider, 
        assetBasicInfo.cloudRegion, assetBasicInfo.cloudTags, assetBasicInfo.description, 
        assetBasicInfo.domain, assetBasicInfo.firstSeen, assetBasicInfo.ipAddress, 
        assetBasicInfo.lastSeen, assetBasicInfo.lastTried, assetBasicInfo.lastUpdated, 
        assetBasicInfo.mac, assetBasicInfo.name, assetBasicInfo.origin, assetBasicInfo.scannerTypes, 
        assetBasicInfo.subType, assetBasicInfo.type, assetBasicInfo.typeGroup, assetBasicInfo.userName, 
        assetCustom.dnsName, assetCustom.manufacturer, assetCustom.model, assetCustom.purchaseDate, 
        assetCustom.serialNumber, assetCustom.stateName, assetCustom.warrantyDate, 
        assetGroups.assetGroupKey, assetGroups.name, installKey, installationId, key, otData.moduleType`,
  ),
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

// Available asset field paths for querying
const availableAssetFields = [
  "key",
  "installKey",
  "installationId",
  "assetBasicInfo.cloudCategory",
  "assetBasicInfo.cloudEnvId",
  "assetBasicInfo.cloudEnvName",
  "assetBasicInfo.cloudOrgId",
  "assetBasicInfo.cloudOrgName",
  "assetBasicInfo.cloudProvider",
  "assetBasicInfo.cloudRegion",
  "assetBasicInfo.cloudTags",
  "assetBasicInfo.description",
  "assetBasicInfo.domain",
  "assetBasicInfo.firstSeen",
  "assetBasicInfo.fqdn",
  "assetBasicInfo.ipAddress",
  "assetBasicInfo.lastSeen",
  "assetBasicInfo.lastTried",
  "assetBasicInfo.lastUpdated",
  "assetBasicInfo.mac",
  "assetBasicInfo.name",
  "assetBasicInfo.origin",
  "assetBasicInfo.scannerTypes",
  "assetBasicInfo.subType",
  "assetBasicInfo.type",
  "assetBasicInfo.typeGroup",
  "assetBasicInfo.userName",
  "assetCustom.comment",
  "assetCustom.department",
  "assetCustom.dnsName",
  "assetCustom.fields.fieldKey",
  "assetCustom.fields.name",
  "assetCustom.fields.value",
  "assetCustom.location",
  "assetCustom.manufacturer",
  "assetCustom.model",
  "assetCustom.purchaseDate",
  "assetCustom.serialNumber",
  "assetCustom.stateName",
  "assetCustom.warrantyDate",
  "assetGroups.assetGroupKey",
  "assetGroups.name",
  "operatingSystem.buildNumber",
  "operatingSystem.caption",
  "operatingSystem.version",
  "otData.moduleType",
  "reconciliations.sourceId",
  "relations.childAssetKey",
  "relations.name",
  "relations.parentAssetKey",
] as const;

const AvailableAssetFieldsSchema = z.enum(availableAssetFields);

// Export types for TypeScript usage
export type AssetsFilterType = z.infer<typeof AssetsFilterTypeEnum>;
export type AssetsFilterConjunction = z.infer<typeof AssetsFilterConjunctionEnum>;
export type AssetsFiltersCondition = z.infer<typeof AssetsFiltersConditionSchema>;
export type AssetsFilterGroupedInput = AssetsFilterGroupedInputType;
export type AvailableAssetFields = z.infer<typeof AvailableAssetFieldsSchema>;

// Define the schema for the tool parameters
export const getAssetsResourcesSchema = {
  siteId: z
    .string()
    .uuid()
    .describe(
      "UUID of the site containing the assets. Use the 'get-authorized-sites' tool to discover available site identifiers and their corresponding UUIDs.",
    ),
  limit: z.number().max(500).optional().describe("Maximum number of assets to return (default: 10)"),
  filters: AssetsFilterGroupedInputSchema.optional().describe(
    "Structured filter object with conditions, conjunctions, and nested groups",
  ),
  fields: z
    .array(AvailableAssetFieldsSchema)
    .max(50)
    .optional()
    .describe(
      `Optional list of specific field paths to request. If not provided, default fields will be used. Maximum 50 fields allowed. Available fields: ${availableAssetFields.join(", ")}`,
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
    fields?: AvailableAssetFields[];
    cursor?: string;
  }>
>): Promise<CallToolResult> => {
  // Define default fields to query if none specified
  const defaultFields: AvailableAssetFields[] = [
    "key",
    "assetBasicInfo.name",
    "assetBasicInfo.domain",
    "assetBasicInfo.type",
    "assetBasicInfo.subType",
    "assetBasicInfo.typeGroup",
    "installationId",
  ];

  // Use user-specified fields or defaults
  const fieldsToQuery = fields.length > 0 ? fields : defaultFields;

  // Prepare pagination object
  const pagination = {
    limit,
    page: cursor ? "NEXT" : "FIRST",
    ...(cursor && { cursor }),
  };

  // Prepare variables for GraphQL query
  const variables: {
    siteId: string;
    fields: AvailableAssetFields[];
    assetPagination: Record<string, unknown>;
    filters?: AssetsFilterGroupedInput;
  } = {
    siteId,
    fields: fieldsToQuery,
    assetPagination: pagination,
  };

  // Only add filters if provided
  if (filters) {
    try {
      variables.filters = filters;
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Invalid filters JSON: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  // Build GraphQL query with variables
  const query = `
    query GetAssetsResources(
      $siteId: ID!
      $fields: [String!]!
      $assetPagination: AssetsPaginationInputValidated
      $filters: AssetsFilterGroupedInput
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
    console.log(error);
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
