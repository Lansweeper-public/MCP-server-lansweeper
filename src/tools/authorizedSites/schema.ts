import { z } from "zod";

// Define interfaces for the GraphQL response
export interface CustomField {
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

export interface AssetRelationType {
  installationId: string;
  name: string;
  reverseName: string;
  default: boolean;
}

export interface AssetState {
  name: string;
  assetStateKey: string;
}

export interface SiteAccount {
  username: string;
  email: string;
  status: string;
  lastTimeAccess: string;
  createdAt: string;
  joinedAt: string;
}

export interface AuthorizedReport {
  id: string;
  name: string;
  isDefault: boolean;
  description: string;
  category: string;
  subcategory: string;
}

export interface Site {
  id: string;
  name: string;
  brandingName: string;
  customFields: CustomField[];
  relations: AssetRelationType[];
  assetStates: AssetState[];
  assetTypes: string[];
  accounts: SiteAccount[];
  authorizedReports: AuthorizedReport[];
}

export interface AuthorizedSitesResponse {
  authorizedSites: {
    sites: Site[];
  };
}

// Define the schema for the tool parameters
export const getAuthorizedSitesSchema = z.object({
  fields: z
    .array(
      z.enum([
        "brandingName",
        "customFields",
        "relations",
        "assetStates",
        "assetTypes",
        "accounts",
        "authorizedReports",
      ]),
    )
    .optional()
    .describe(
      "Optional list of specific fields to include in the query. Options: brandingName, customFields, relations, assetStates, assetTypes, accounts, authorizedReports.",
    ),
});

// Export input type
export type GetAuthorizedSitesInput = {
  fields?: Array<
    "brandingName" | "customFields" | "relations" | "assetStates" | "assetTypes" | "accounts" | "authorizedReports"
  >;
};
