#!/usr/bin/env node

import { GraphQLClient } from "graphql-request";
import { getIntrospectionQuery, buildClientSchema, printSchema } from "graphql";

const LANSWEEPER_API_BASE = "https://api.lansweeper.com/api/integrations/graphql";
const LANSWEEPER_PERSONAL_ACCESS_TOKEN = process.env.LANSWEEPER_PERSONAL_ACCESS_TOKEN;

async function introspectSchema() {
  if (!LANSWEEPER_PERSONAL_ACCESS_TOKEN) {
    console.error("LANSWEEPER_PERSONAL_ACCESS_TOKEN environment variable is not set");
    process.exit(1);
  }

  const client = new GraphQLClient(LANSWEEPER_API_BASE, {
    headers: {
      Authorization: `Token ${LANSWEEPER_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  try {
    console.log("Introspecting Lansweeper GraphQL schema...");
    const introspectionQuery = getIntrospectionQuery();
    const result = await client.request(introspectionQuery);

    const schema = buildClientSchema(result);
    const schemaSDL = printSchema(schema);

    console.log("Schema introspection complete. Writing to file...");

    // Write the schema to a file
    const fs = await import("fs");
    fs.writeFileSync("lansweeper-schema.graphql", schemaSDL);
    console.log("Schema written to lansweeper-schema.graphql");

    // Extract asset-related types
    const assetTypes = schemaSDL.match(/type.*Asset.*{[\s\S]*?^}/gm) || [];
    console.log("\nAsset-related types found:");
    assetTypes.forEach((type) => {
      console.log("---");
      console.log(type);
    });
  } catch (error) {
    console.error("Error introspecting schema:", error);
    process.exit(1);
  }
}

introspectSchema();
