import { createGraphQLClient } from "../../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { GetAuthorizedSitesInput, AuthorizedSitesResponse } from "./schema.js";

// Implementation of the getAuthorizedSites tool
export const getAuthorizedSitesHandler = async ({
  fields = [], // Default to empty array if not provided
}: GetAuthorizedSitesInput): Promise<CallToolResult> => {
  // Build dynamic query based on requested fields
  const buildFieldQuery = (field: string): string => {
    switch (field) {
      case "brandingName":
        return `brandingName`;
      case "customFields":
        return `customFields {
            name
            type
            key
            props {
              currencyType
              options
              linkTag
              minNumericValue
              maxNumericValue
            }
        }`;
      case "relations":
        return `relations {
            installationId
            name
            reverseName
            default
        }`;
      case "assetStates":
        return `assetStates {
            name
            assetStateKey
        }`;
      case "assetTypes":
        return `assetTypes`;
      case "accounts":
        return `accounts {
            username
            email
            status
            lastTimeAccess
            createdAt
            joinedAt
        }`;
      case "authorizedReports":
        return `authorizedReports {
            id
            name
            isDefault
            description
            category
            subcategory
        }`;
      default:
        // If the field is not recognized, return an empty string
        return "";
    }
  };

  // Build the fields part of the query
  const fieldsQuery = fields?.map(buildFieldQuery).join("\n");

  // Build the GraphQL query for authorizedSites
  const query = `
    query GetAuthorizedSites {
      authorizedSites {
        sites {
          id
          name
          ${fieldsQuery}
        }
      }
    }
  `;

  try {
    const client = createGraphQLClient();
    const response = await client.request<AuthorizedSitesResponse>(query);

    // Extract the sites from the response
    const sites = response.authorizedSites.sites;

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
          text: `Error fetching authorized sites: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
};
