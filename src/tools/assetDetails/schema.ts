import { z } from "zod";

// Define the schema for the tool parameters
export const getAssetDetailsSchema = {
  siteId: z
    .string()
    .uuid()
    .describe(
      "UUID of the site containing the asset. Use the 'get-authorized-sites' tool to discover available site identifiers and their corresponding UUIDs.",
    ),
  assetKey: z.string().describe("Key of the asset to retrieve details for"),
  fields: z
    .array(z.string())
    .optional()
    .describe("Optional list of specific fields to request. If not provided, a default set of fields will be used."),
};

// Export types for TypeScript usage
export type GetAssetDetailsInput = z.infer<
  z.ZodSchema<{
    siteId: string;
    assetKey: string;
    fields?: string[];
  }>
>;
