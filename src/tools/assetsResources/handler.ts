import { createGraphQLClient } from "../../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { GetAssetsResourcesInput, SiteAssetResourcesResponse, AvailableAssetFields } from "./schema.js";

// Implementation of the get-assets-resources tool
export const getAssetsResourcesHandler = async ({
  siteId,
  limit = 10,
  filters,
  fields = [],
  cursor,
}: GetAssetsResourcesInput): Promise<CallToolResult> => {
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
    filters?: GetAssetsResourcesInput["filters"];
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
