# Yuque MCP Server - GitHub Copilot Instructions

## Project Overview

This is a Yuque API integration server based on Model Context Protocol (MCP), allowing AI models to interact with the Yuque knowledge base platform through a standardized protocol. The project is developed in TypeScript and supports both stdio and HTTP running modes.

### Core Features
- **Document Management**: Create, read, update, and delete Yuque documents (with chunking support for large documents)
- **Repository Operations**: Get user and team repository information
- **Search Functionality**: Search content within the Yuque platform
- **Statistical Analysis**: Get statistics for teams, members, repositories, and documents
- **User Information**: Retrieve current user and other users' detailed information
- **MCP Prompts**: Pre-defined prompts for document analysis, writing assistance, and knowledge base management
- **MCP Resources**: Static resources and dynamic resource templates for accessing Yuque content

### Tech Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Core Frameworks**:
  - `@modelcontextprotocol/sdk` - MCP protocol implementation
  - `express` - HTTP server
  - `axios` - HTTP client
  - `zod` - Data validation and runtime type checking
- **Testing**: Vitest (test framework)
- **Development Tools**: ts-node-dev, nodemon
- **Deployment**: Docker + Docker Compose

## Project Architecture

### Directory Structure
```
src/
  ├── index.ts              # Main entry point, handles server startup mode (stdio/HTTP)
  ├── cli.ts                # CLI mode entry point (shebang script)
  ├── server.ts             # MCP server core implementation, registers tools/prompts/resources
  ├── config.ts             # Configuration management with Zod validation
  ├── mcp_hook.ts           # MCP protocol hooks, handles query parameters and message body
  ├── tools/                # Modular tool registration
  │   ├── index.ts          # Tool registration coordinator, AVAILABLE_TOOLS list
  │   ├── types.ts          # Tool-related type definitions (ServiceFactory, ToolResponse, etc.)
  │   ├── user-tools.ts     # User-related MCP tools (get_current_user, get_user_docs)
  │   ├── repo-tools.ts     # Repository-related tools (get_user_repos, get_repo_docs)
  │   ├── doc-tools.ts      # Document CRUD tools with chunking support
  │   ├── search-tools.ts   # Search functionality
  │   └── stats-tools.ts    # Team statistics and analytics
  ├── prompts/              # MCP prompts
  │   └── index.ts          # Pre-defined prompts for document operations
  ├── resources/            # MCP resources
  │   └── index.ts          # Static resources and dynamic resource templates
  └── services/
      ├── types.ts          # TypeScript type definitions for all Yuque entities
      ├── yuque.ts          # Backward compatible exports
      └── yuque/
          ├── index.ts      # Main YuqueService (facade pattern, shared Axios instance)
          ├── client.ts     # Base HTTP client with authentication
          ├── user.ts       # UserService - User-related operations
          ├── group.ts      # GroupService - Group/team management
          ├── repo.ts       # RepoService - Repository (Book) operations
          ├── document.ts   # DocumentService - Document CRUD operations
          ├── toc.ts        # TocService - Table of contents management
          ├── search.ts     # SearchService - Search functionality
          └── statistics.ts # StatisticsService - Analytics operations

test/                       # Test files (Vitest)
  ├── services/             # Service layer tests
  └── tools/                # Tool registration tests
```

### Core Component Descriptions

#### 1. `index.ts` - Server Entry Point
- Detects running mode (stdio or HTTP)
- Loads configuration and initializes server
- Handles startup errors

#### 2. `server.ts` - YuqueMcpServer Class
**Main Responsibilities**:
- Initialize MCP server instance with capabilities (logging, tools, prompts, resources)
- Register all Yuque-related tools, prompts, and resources via modular registration
- Provide HTTP and SSE (Server-Sent Events) endpoints
- Handle logging through MCP logging protocol

**Key Methods**:
- `registerTools()` - Register all MCP tools via `registerAllTools()`
- `registerPrompts()` - Register all MCP prompts via `registerAllPrompts()`
- `registerResources()` - Register all MCP resources via `registerAllResources()`
- `createYuqueService()` - Create Yuque service instance with optional access token override
- `startHttpServer()` - Start HTTP server with health check endpoint
- `connect()` - Connect stdio transport layer

#### 3. `tools/` - Modular Tool Registration

**Tool Organization**:
- **`index.ts`**: Coordinates all tool registration, exports AVAILABLE_TOOLS list
- **`types.ts`**: Type definitions including `ServiceFactory`, `ToolResponse`, `DocChunk`, `ChunkInfo`
- **`user-tools.ts`**: 
  - `get_current_user` - Get current user information
  - `get_user_docs` - Get user document list
- **`repo-tools.ts`**:
  - `get_user_repos` - Get user repositories
  - `get_repo_docs` - Get documents in a repository
- **`doc-tools.ts`** (with chunking support):
  - `get_doc_chunked` - Get document with chunking support
  - `get_doc_full` - Get full document without chunking
  - `get_doc_chunks_info` - Get document chunk metadata
  - `create_doc_chunked` / `create_doc_full` - Create new document
  - `update_doc_chunked` / `update_doc_full` - Update document
  - `delete_doc` - Delete document
  - `splitDocumentContent()` - Utility to split large documents
- **`search-tools.ts`**:
  - `search` - Search documents or repositories
- **`stats-tools.ts`**:
  - `get_group_statistics` - Team summary statistics
  - `get_group_member_statistics` - Member statistics
  - `get_group_book_statistics` - Repository statistics
  - `get_group_doc_statistics` - Document statistics

#### 4. `prompts/` - MCP Prompts

**Available Prompts** (defined in `prompts/index.ts`):
- **`analyze_yuque_doc`** - Analyze document content, provide summary, key points, and improvement suggestions
- **`create_yuque_doc`** - Assist in creating structured Yuque documents with format suggestions
- **`search_yuque`** - Help search and organize information in Yuque
- **`yuque_writing_assistant`** - Provide writing suggestions including format, structure, and content optimization
- **`yuque_knowledge_base_guide`** - Best practices for knowledge base organization and management

Each prompt has:
- `name` - Unique identifier
- `title` - Display title
- `argsSchema` - Zod schema for parameter validation
- Handler function returning prompt messages

#### 5. `resources/` - MCP Resources

**Static Resources**:
- **`yuque-writing-guide`** (`yuque://docs/writing-guide`) - Best practices for Yuque document writing
- **`yuque-markdown-cheatsheet`** (`yuque://docs/markdown-cheatsheet`) - Markdown syntax quick reference
- **`yuque-api-quickstart`** (`yuque://docs/api-quickstart`) - API quick start guide

**Resource Templates** (dynamic):
- **`yuque-repo-info`** (`yuque://repos/{namespace}`) - Get repository information
- **`yuque-doc-content`** (`yuque://docs/{namespace}/{slug}`) - Get document content
- **`yuque-repo-toc`** (`yuque://toc/{namespace}`) - Get repository table of contents

#### 6. `services/yuque/` - Modular Service Architecture

**Design Pattern**: Facade with Shared Axios Instance

The `YuqueService` class in `index.ts`:
- Creates a single shared Axios instance
- Initializes all sub-services with the shared instance
- Provides a unified interface delegating to sub-services
- Supports dynamic configuration updates

**Service Components**:

- **`client.ts`**: Base HTTP client
  - `createAxiosInstance()` - Factory for configured Axios instances
  - `YuqueClient` - Legacy client wrapper for config management
  - Authentication header handling
  - Health check endpoint

- **`user.ts`** (`UserService`): 
  - `getCurrentUser()` - Get authenticated user info
  - `getUserDocs()` - Get user's documents
  - `getUserGroups()` - Get user's groups

- **`group.ts`** (`GroupService`):
  - `getGroupMembers()` - Get group members
  - `updateGroupMember()` - Update member role
  - `deleteGroupMember()` - Remove member from group

- **`repo.ts`** (`RepoService`):
  - `getUserRepos()` / `getGroupRepos()` - Get repositories
  - `getRepo()` - Get repository details
  - `createRepo()` / `createGroupRepo()` - Create repositories
  - `updateRepo()` / `deleteRepo()` - Modify repositories

- **`document.ts`** (`DocumentService`):
  - `getRepoDocs()` - List documents in repository
  - `getDoc()` - Get document details
  - `createDoc()` / `updateDoc()` / `deleteDoc()` - CRUD operations
  - `getDocVersions()` / `getDocVersion()` - Version management

- **`toc.ts`** (`TocService`):
  - `getRepoToc()` - Get repository table of contents
  - `updateRepoToc()` - Modify TOC structure

- **`search.ts`** (`SearchService`):
  - `search()` - Search documents or repositories with filtering

- **`statistics.ts`** (`StatisticsService`):
  - `getGroupStatistics()` - Team summary stats
  - `getGroupMemberStatistics()` - Member contribution stats
  - `getGroupBookStatistics()` - Repository stats
  - `getGroupDocStatistics()` - Document performance stats

#### 7. `config.ts` - Configuration Management
Uses Zod to validate environment variables:
- `PORT` - HTTP server port (default 3000)
- `YUQUE_API_TOKEN` - Yuque API token (optional, can be provided via query param)
- `YUQUE_API_BASE_URL` - API base URL (default https://www.yuque.com/api/v2)

#### 8. `mcp_hook.ts` - Protocol Hooks
Handles special requirements in HTTP mode:
- `mcpHook_updateMessageEndpoint()` - Extract query params from URL, inject into endpoint
- `mcpHook_updateMessageBody()` - Inject query parameters into tool call parameters
- `getFixedQuery()` - Handle array-type query parameters
- Support dynamic configuration override via query params (`accessToken`, `baseUrl`)

## Running Modes

### 1. Stdio Mode (CLI)
- Communicates via standard input/output
- Suitable for integration into other applications (e.g., Claude Desktop)
- Start with: `npm run dev:cli` or `npm run start:cli`

### 2. HTTP Mode (Server)
- Provides HTTP API and SSE endpoints
- Supports multiple client connections
- Query parameters can dynamically override configuration
- Start with: `npm run dev` or `npm run start`

**HTTP Endpoints**:
- `GET /health` - Health check with memory usage stats
- `GET /sse` - SSE endpoint for MCP communication
- `POST /messages` - Message endpoint for MCP requests

**SSE Endpoint Features**:
```
GET /sse?accessToken=<token>&baseUrl=<url>
```
- Query parameters have higher priority than environment variables
- Each connection can use different configurations
- Supports multi-user/multi-environment scenarios

## Testing

The project uses Vitest for testing.

**Run tests**:
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

**Test Structure**:
- `test/services/` - Tests for service layer (client, user, document, etc.)
- `test/tools/` - Tests for tool registration and functionality

## Development Guide

### Steps to Add New Tools

1. **Add API method in the appropriate service module** (`services/yuque/*.ts`):
```typescript
// In services/yuque/your-service.ts
import { AxiosInstance } from 'axios';

export class YourService {
  constructor(private client: AxiosInstance) {}
  
  async newApiMethod(param: string): Promise<YourType> {
    const response = await this.client.get(`/endpoint/${param}`);
    return response.data.data;
  }
}
```

2. **Expose method in YuqueService** (`services/yuque/index.ts`):
```typescript
// Add service initialization in constructor
this.yourService = new YourService(this.axiosInstance);

// Add public method
async newApiMethod(param: string) {
  return this.yourService.newApiMethod(param);
}
```

3. **Register tool in tool module** (`tools/your-tools.ts`):
```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory, ToolResponse } from "./types";
import { Logger } from "../server";

export function registerYourTools(server: McpServer, createService: ServiceFactory): void {
  server.tool(
    "tool_name",
    "Tool description in Chinese",
    {
      param: z.string().describe("Parameter description"),
      accessToken: z.string().optional().describe("Token for authenticating API requests"),
    },
    async ({ param, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Operation: ${param}`);
        const yuqueService = createService(accessToken);
        const result = await yuqueService.newApiMethod(param);
        
        Logger.log(`Success`);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error:`, error);
        return {
          content: [{ type: "text", text: `Error: ${error}` }],
        };
      }
    }
  );
}
```

4. **Export from tools index** (`tools/index.ts`):
```typescript
import { registerYourTools } from "./your-tools";

export function registerAllTools(server: McpServer, createService: ServiceFactory): void {
  // ... other registrations
  registerYourTools(server, createService);
}

// Add to AVAILABLE_TOOLS list
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  // ... other tools
  { name: "tool_name", description: "Tool description" },
];
```

5. **Add tests** (`test/tools/your-tools.test.ts`):
```typescript
import { describe, it, expect } from "vitest";

describe("Your Tools", () => {
  it("should register tools correctly", () => {
    // Test implementation
  });
});
```

6. **Update README** with new tool description

### Steps to Add New Prompts

1. **Register prompt in** `prompts/index.ts`:
```typescript
server.registerPrompt(
  "prompt_name",
  {
    title: "Prompt Title",
    description: "Prompt description",
    argsSchema: {
      param: z.string().describe("Parameter description"),
    },
  },
  async ({ param }) => {
    return {
      description: `Prompt description: ${param}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Your prompt text here with ${param}`,
          },
        },
      ],
    };
  }
);
```

2. **Add to AVAILABLE_PROMPTS list**

### Steps to Add New Resources

1. **For static resources** (`resources/index.ts`):
```typescript
// Add to STATIC_RESOURCES object
const STATIC_RESOURCES: Record<string, string> = {
  "yuque://docs/your-resource": `# Your Resource Content`,
};

// Register the resource
server.registerResource(
  "your-resource-name",
  "yuque://docs/your-resource",
  {
    title: "Your Resource Title",
    description: "Description",
    mimeType: "text/markdown",
  },
  async (uri) => {
    const content = STATIC_RESOURCES["yuque://docs/your-resource"];
    return {
      contents: [{ uri: uri.toString(), mimeType: "text/markdown", text: content }],
    };
  }
);
```

2. **For dynamic resource templates**:
```typescript
server.registerResource(
  "your-resource-template",
  new ResourceTemplate("yuque://your/{param}", { list: undefined }),
  {
    title: "Your Resource Title",
    description: "Description",
    mimeType: "application/json",
  },
  async (uri, variables) => {
    const param = Array.isArray(variables.param) ? variables.param[0] : variables.param;
    // Fetch data using yuqueService
    return {
      contents: [{ uri: uri.toString(), mimeType: "application/json", text: JSON.stringify(data) }],
    };
  }
);
```

### Code Standards

1. **Type Safety**:
   - Define TypeScript interfaces for all API responses in `services/types.ts`
   - Use Zod to validate input parameters for tools and prompts
   - Avoid using `any` type
   - Export types from `tools/types.ts` for tool-related types

2. **Error Handling**:
   - All tool methods must catch exceptions and return user-friendly error messages
   - Use `Logger.error()` to log errors through MCP logging protocol
   - Always return a valid `ToolResponse` object even on error

3. **Naming Conventions**:
   - Class names: PascalCase (e.g., `YuqueMcpServer`, `DocumentService`)
   - Interface names: PascalCase with Yuque prefix (e.g., `YuqueUser`, `YuqueDoc`)
   - Method names: camelCase (e.g., `getUserDocs`, `createDoc`)
   - Tool names: snake_case (e.g., `get_current_user`, `create_doc`)
   - Constants: UPPER_SNAKE_CASE (e.g., `AVAILABLE_TOOLS`, `MAXIMUM_CHUNK_SIZE`)
   - Files: lowercase with hyphens/underscores (e.g., `user-tools.ts`, `doc_tools.ts`)

4. **Documentation Strings**:
   - Tool descriptions in Chinese
   - Clear and explicit parameter descriptions
   - Include usage examples (in README)

5. **Import Order**:
   ```typescript
   // 1. External packages
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { z } from "zod";
   
   // 2. Internal imports
   import { ServiceFactory } from "./types";
   import { Logger } from "../server";
   ```

### Debugging Tips

1. **Development Mode**:
   - Use `npm run dev` to start with auto-reload
   - Check console log output via `Logger.log()` and `Logger.error()`

2. **View API Calls**:
   - Add logs in service methods
   - Use axios interceptors to view requests/responses

3. **Test Tool Calls**:
   - HTTP mode: Use Postman or curl to test `/sse` endpoint
   - Stdio mode: Integrate into MCP client for testing
   - Run tests: `npm test`

## Deployment Considerations

### Docker Deployment
- Use provided `Dockerfile` and `docker-compose.yml`
- Configure environment variables via `.env` file
- Default exposed port is 3000

### Production Environment Configuration
1. **Must Set**:
   - `YUQUE_API_TOKEN` - Otherwise most API calls will fail

2. **Optional Configuration**:
   - `YUQUE_API_BASE_URL` - If using private deployment
   - `PORT` - Custom port

3. **Security Recommendations**:
   - Don't hardcode tokens in code
   - Use environment variables or query parameters to pass sensitive information
   - Consider adding HTTPS and authentication

## Common Issues

### 1. Document Content Too Large Causing Timeout
- Project has implemented `splitDocumentContent()` method in `doc-tools.ts`
- Automatically splits large documents into 100KB chunks (configurable)
- Each chunk includes overlapping content (200 chars) to maintain context
- Use `get_doc_chunked` tool for large documents

### 2. API Token Not Set
- Server will output warning but won't exit
- Can provide token dynamically via query parameter: `?accessToken=your_token`
- Suitable for multi-user scenarios

### 3. CORS Issues (HTTP Mode)
- CORS middleware is already enabled
- Allows access from all origins

## Related Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Yuque Open API Documentation](https://app.swaggerhub.com/apis-docs/Jeff-Tian/yuque-open_api/2.0.1)
- [Project GitHub Repository](https://github.com/Henryhaoson/Yueque-MCP-Server)
- [Smithery Installation Page](https://smithery.ai/server/@HenryHaoson/Yuque-MCP-Server)

---

**Last Updated**: January 31, 2026
