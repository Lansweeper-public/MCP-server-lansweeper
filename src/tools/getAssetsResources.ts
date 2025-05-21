import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define the schema for the tool parameters
export const getAssetsResourcesSchema = {
  siteId: z.string().describe("ID of the site containing the assets"),
  limit: z.number().optional().describe("Maximum number of assets to return (default: 10)"),
  filters: z
    .string()
    .optional()
    .describe("Filter expression in GraphQL format (e.g., { conjunction: AND, conditions: [...] })"),
  fields: z
    .array(z.string())
    .optional()
    .describe(
      "Optional list of specific fields or field groups to request. If not provided, all default groups will be used. " +
        "Available field groups: 'basic', 'network', 'time', 'hardware', 'location', 'operating_system', 'custom_fields', 'state', 'relationships'. " +
        "You can also provide specific individual fields like 'key' or 'assetBasicInfo.name'.",
    ),
  cursor: z.string().optional().describe("Cursor for pagination"),
  page: z.enum(["FIRST", "PREV", "NEXT", "LAST"]).optional().describe("Page direction for cursor-based pagination"),
};

// Implementation of the get-assets-resources tool
export const getAssetsResourcesHandler = async ({
  siteId,
  limit = 10,
  filters,
  fields = [],
  cursor,
  page,
}: z.infer<
  z.ZodSchema<{
    siteId: string;
    limit?: number;
    filters?: string;
    fields?: string[];
    cursor?: string;
    page?: "FIRST" | "PREV" | "NEXT" | "LAST";
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

  // Prepare pagination input
  let paginationInput = "";
  if (cursor || page) {
    paginationInput = "{";
    if (cursor) paginationInput += `cursor: "${cursor}", `;
    if (page) paginationInput += `page: ${page}, `;
    if (limit) paginationInput += `limit: ${limit}`;
    paginationInput += "}";
  } else if (limit) {
    paginationInput = `{ limit: ${limit} }`;
  }

  // Build GraphQL query
  const query = `
    query GetAssetsResources {
      site(id: "${siteId}") {
        assetResources(
          fields: [${fieldsToQuery.map((field) => `"${field}"`).join(", ")}]
          ${paginationInput ? `assetPagination: ${paginationInput}` : ""}
          ${filters ? `filters: ${filters}` : ""}
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
    const response = await client.request(query);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
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
