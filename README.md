# Lansweeper MCP Server

An MCP (Model Context Protocol) server for querying the Lansweeper API.

## Installation

You can install this package from npm:

```bash
# Using npm
npm install @lansweeper-public/mcp-server-lansweeper

# Using yarn
yarn add @lansweeper-public/mcp-server-lansweeper
```

## Overview

This MCP server provides a standardized interface to interact with the Lansweeper API, allowing you to query asset information, search assets, and retrieve site details.

## Prerequisites

- Node.js (v16 or later)
- Lansweeper account with API access

## Configuration

The server requires a Lansweeper Personal Access Token to authenticate with the API. Set it as an environment variable:

```bash
export LANSWEEPER_PERSONAL_ACCESS_TOKEN=your_token_here
```

For persistent configuration, add this to your `.bashrc`, `.zshrc`, or equivalent shell configuration file.

## Usage

### As a dependency in your project

```javascript
import { startServer } from '@lansweeper-public/mcp-server-lansweeper';

// Start the server
startServer();
```

### As a standalone server

Start the server:

```bash
npx @lansweeper-public/mcp-server-lansweeper
```

### Available Tools

The MCP server provides the following tools:

1. `get-assets`: Retrieve a list of assets from Lansweeper
2. `get-asset-details`: Get detailed information about a specific asset
3. `search-assets`: Search for assets by name or other criteria
4. `get-sites`: Get a list of Lansweeper sites

## Development

For development of this package:

1. Clone this repository
2. Install dependencies:

```bash
yarn install
```

3. Build the project:

```bash
yarn build
```

4. Run in development mode:

```bash
yarn dev
```

## License

ISC
