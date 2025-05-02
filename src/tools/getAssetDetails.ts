import { z } from "zod";
import { createGraphQLClient } from "../client/graphqlClient";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define the schema for the tool parameters
export const getAssetDetailsSchema = {
  siteId: z.string().describe("ID of the site containing the asset"),
  assetKey: z.string().describe("Key of the asset to retrieve details for"),
  fields: z
    .array(z.string())
    .optional()
    .describe("Optional list of specific fields to request. If not provided, a default set of fields will be used."),
};

// Implementation of the get-asset-details tool
export const getAssetDetailsHandler = async ({
  siteId,
  assetKey,
  fields = [], // Default to empty array if not provided
}: z.infer<
  z.ZodSchema<{
    siteId: string;
    assetKey: string;
    fields?: string[];
  }>
>): Promise<CallToolResult> => {
  // Define default fields to query if none specified
  const defaultFields = [
    "assetBasicInfo",
    "assetCustom",
    "operatingSystem",
    "processors",
    "logicalDisks",
    "networkAdapters",
    "softwares",
  ];

  // Use user-specified fields or defaults
  const fieldsToQuery = fields.length > 0 ? fields : defaultFields;

  // Build dynamic query based on requested fields
  const buildFieldQuery = (field: string): string => {
    switch (field) {
      case "assetCustom":
        return `assetCustom {
          purchaseDate
          warrantyDate
          lastPatched
          manufacturer
          model
          serialNumber
          location
          department
          comment
          fields {
            value
            fieldKey
            name
          }
          stateKey
        }`;
      case "operatingSystem":
        return `operatingSystem {
          caption
          version
          buildNumber
          servicePackMajorVersion
          installDate
          registeredUser
        }`;
      case "processors":
        return `processors {
          manufacturer
          name
          model
          numberOfCores
          numberOfLogicalProcessors
          currentClockSpeed
          maxClockSpeed
        }`;
      case "logicalDisks":
        return `logicalDisks {
          caption
          description
          fileSystem
          freeSpace
          size
          volumeName
        }`;
      case "networkAdapters":
        return `networkAdapters {
          macAddress
          manufacturer
          name
          speed
        }`;
      case "softwares":
        return `softwares {
          name
          publisher
          version
          installDate
        }`;
      case "assetBasicInfo":
      default:
        return `assetBasicInfo {
          name
          domain
          description
          firstSeen
          fqdn
          ipAddress
          mac
          lastSeen
          type
          subType
          typeGroup
          cloudCategory
          cloudProvider
          cloudRegion
          lastUpdated
        }`;
    }
  };

  // Build the fields part of the query
  const fieldsQuery = fieldsToQuery.map(buildFieldQuery).join("\n");

  // Build the complete GraphQL query
  const query = `
    query GetAssetDetails {
      site(id: "${siteId}") {
        assetDetails(key: "${assetKey}") {
          ${fieldsQuery}
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
          text: `Error fetching asset details: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
};
