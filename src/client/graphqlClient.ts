import { GraphQLClient } from "graphql-request";

// Lansweeper API base URL
const LANSWEEPER_API_BASE = "https://api.lansweeper.com/api/integrations/graphql";

// Get Lansweeper Personal Access Token from environment variable
const LANSWEEPER_PERSONAL_ACCESS_TOKEN = process.env.LANSWEEPER_PERSONAL_ACCESS_TOKEN;

// Create a GraphQL client instance with token authentication
export function createGraphQLClient(): GraphQLClient {
  if (!LANSWEEPER_PERSONAL_ACCESS_TOKEN) {
    throw new Error("LANSWEEPER_PERSONAL_ACCESS_TOKEN environment variable is not set");
  }

  return new GraphQLClient(`${LANSWEEPER_API_BASE}`, {
    headers: {
      Authorization: `Token ${LANSWEEPER_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}
