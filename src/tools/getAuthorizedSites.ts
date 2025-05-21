import { createGraphQLClient } from "../client/graphqlClient.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define interfaces for the GraphQL response
interface CustomField {
  name: string;
  type: string;
  key: string;
  props: {
    currencyType?: string;
    options?: string[];
    linkTag?: string;
    minNumericValue?: number;
    maxNumericValue?: number;
  };
}

interface AssetRelationType {
  installationId: string;
  name: string;
  reverseName: string;
  default: boolean;
}

interface AssetState {
  name: string;
  assetStateKey: string;
}

interface SiteAccount {
  username: string;
  email: string;
  status: string;
  lastTimeAccess: string;
  createdAt: string;
  joinedAt: string;
}

interface AuthorizedReport {
  id: string;
  name: string;
  isDefault: boolean;
  description: string;
  category: string;
  subcategory: string;
}

interface Site {
  id: string;
  name: string;
  brandingName: string;
  logoUrl: string;
  companyName: string;
  customFields: CustomField[];
  relations: AssetRelationType[];
  assetStates: AssetState[];
  assetTypes: string[];
  accounts: SiteAccount[];
  authorizedReports: AuthorizedReport[];
  isDashboardIntegrationEnabled?: boolean;
}

interface AuthorizedSitesResponse {
  authorizedSites: {
    sites: Site[];
  };
}

// Define the schema for the tool parameters
// This tool doesn't require any parameters since authorizedSites doesn't take any in the API
export const getAuthorizedSitesSchema = {};

// Implementation of the getAuthorizedSites tool
export const getAuthorizedSitesHandler = async (): Promise<CallToolResult> => {
  // Build the GraphQL query for authorizedSites
  const query = `
    query GetAuthorizedSites {
      authorizedSites {
        sites {
          id
          name
          brandingName
          logoUrl
          companyName
          customFields {
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
          }
          relations {
            installationId
            name
            reverseName
            default
          }
          assetStates {
            name
            assetStateKey
          }
          assetTypes
          accounts {
            username
            email
            status
            lastTimeAccess
            createdAt
            joinedAt
          }
          authorizedReports {
            id
            name
            isDefault
            description
            category
            subcategory
          }
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
