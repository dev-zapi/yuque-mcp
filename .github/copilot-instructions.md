# Yuque MCP Server - GitHub Copilot Instructions

## Project Overview

This is a Yuque API integration server based on Model Context Protocol (MCP), allowing AI models to interact with the Yuque knowledge base platform through a standardized protocol. The project is developed in TypeScript and supports both stdio and HTTP running modes.

### Core Features
- **Document Management**: Create, read, update, and delete Yuque documents
- **Repository Operations**: Get user and team repository information
- **Search Functionality**: Search content within the Yuque platform
- **Statistical Analysis**: Get statistics for teams, members, repositories, and documents
- **User Information**: Retrieve current user and other users' detailed information

### Tech Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Core Frameworks**:
  - `@modelcontextprotocol/sdk` - MCP protocol implementation
  - `express` - HTTP server
  - `axios` - HTTP client
  - `zod` - Data validation
- **Development Tools**: ts-node-dev, nodemon
- **Deployment**: Docker + Docker Compose

## Project Architecture

### Directory Structure
```
src/
  ├── index.ts           # Main entry point, handles server startup mode (stdio/HTTP)
  ├── cli.ts             # CLI mode entry point
  ├── server.ts          # MCP server core implementation, registers all tools
  ├── config.ts          # Configuration management, reads environment variables
  ├── mcp_hook.ts        # MCP protocol hooks, handles query parameters and message body
  └── services/
      ├── types.ts       # TypeScript type definitions for all Yuque entities
      ├── yuque.ts       # Backward compatible exports
      └── yuque/
          ├── index.ts       # Main YuqueService that combines all sub-services
          ├── client.ts      # Base HTTP client with authentication
          ├── user.ts        # User-related operations
          ├── group.ts       # Group/team management operations
          ├── repo.ts        # Repository (Book) operations
          ├── document.ts    # Document CRUD operations
          ├── toc.ts         # Table of contents management
          ├── search.ts      # Search functionality
          └── statistics.ts  # Analytics and statistics operations
```

### Core Component Descriptions

#### 1. `index.ts` - Server Entry Point
- Detects running mode (stdio or HTTP)
- Loads configuration and initializes server
- Handles startup errors

#### 2. `server.ts` - YuqueMcpServer Class
**Main Responsibilities**:
- Initialize MCP server instance
- Register all Yuque-related tools
- Provide HTTP and SSE (Server-Sent Events) endpoints
- Handle document content chunking (prevent oversized responses)

**Key Methods**:
- `registerTools()` - Register all MCP tools
- `createYuqueService()` - Create Yuque service instance
- `splitDocumentContent()` - Split large documents into chunks
- `startHttpServer()` - Start HTTP server
- `connect()` - Connect stdio transport layer

**Tool Categories**:
1. **User and Document Management**:
   - `get_current_user` - Get current user information
   - `get_user_docs` - Get user document list
   - `get_user_repos` - Get user repositories
   - `get_repo_docs` - Get documents in a repository
   - `get_doc` - Get document details
   - `create_doc` - Create new document
   - `update_doc` - Update document
   - `delete_doc` - Delete document
   - `search` - Search content

2. **Team Statistics and Analytics**:
   - `get_group_statistics` - Team summary statistics
   - `get_group_member_statistics` - Member statistics
   - `get_group_book_statistics` - Repository statistics
   - `get_group_doc_statistics` - Document statistics

#### 3. `services/` - Modular Service Architecture

**Main Components**:

- **`types.ts`**: Central type definitions for all Yuque entities
  - `YuqueUser`, `YuqueGroup`, `YuqueDoc`, `YuqueRepo`
  - `YuqueDocVersion`, `YuqueTocItem`, `YuqueSearchResult`
  - All interface definitions shared across services

- **`yuque/client.ts`**: Base HTTP client (`YuqueClient`)
  - Axios instance management
  - Authentication header handling
  - Configuration update methods
  - Health check endpoint

- **`yuque/user.ts`**: User operations (`UserService`)
  - Get current user, user documents, user groups
  
- **`yuque/group.ts`**: Group management (`GroupService`)
  - Group member CRUD operations
  
- **`yuque/repo.ts`**: Repository operations (`RepoService`)
  - User and group repository management
  - Repository CRUD operations
  
- **`yuque/document.ts`**: Document operations (`DocumentService`)
  - Document CRUD with version management
  - Filters out unnecessary content formats
  
- **`yuque/toc.ts`**: Table of contents (`TocService`)
  - Repository TOC management
  
- **`yuque/search.ts`**: Search operations (`SearchService`)
  - Document and repository search
  
- **`yuque/statistics.ts`**: Analytics (`StatisticsService`)
  - Team, member, repository, and document statistics
  
- **`yuque/index.ts`**: Main `YuqueService` class
  - Combines all sub-services
  - Delegates method calls to appropriate services
  - Maintains backward compatibility with previous monolithic design

#### 4. `config.ts` - Configuration Management
Uses Zod to validate environment variables:
- `PORT` - HTTP server port (default 3000)
- `YUQUE_API_TOKEN` - Yuque API token (optional)
- `YUQUE_API_BASE_URL` - API base URL (default https://www.yuque.com/api/v2)

#### 5. `mcp_hook.ts` - Protocol Hooks
Handles special requirements in HTTP mode:
- Extract `accessToken` and `baseUrl` from URL query parameters
- Inject query parameters into tool call parameters
- Support dynamic configuration override

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

**SSE Endpoint Features**:
```
GET /sse?accessToken=<token>&baseUrl=<url>
```
- Query parameters have higher priority than environment variables
- Each connection can use different configurations
- Supports multi-user/multi-environment scenarios

## Development Guide

### Steps to Add New Tools

1. **Choose or create appropriate service module in `services/yuque/`**:
   - For user operations: `user.ts`
   - For documents: `document.ts`
   - For repositories: `repo.ts`
   - For new functionality: create a new service file

2. **Add API method in the service class**:
```typescript
// In services/yuque/your-service.ts
import { YuqueClient } from './client';
import { YourType } from '../types';

export class YourService extends YuqueClient {
  async newApiMethod(param: string): Promise<YourType> {
    const response = await this.client.get(`/endpoint/${param}`);
    return response.data.data;
  }
}
```

3. **Add service to main YuqueService in `services/yuque/index.ts`**:
```typescript
import { YourService } from './your-service';

export class YuqueService {
  private yourService: YourService;
  
  constructor(apiToken: string = '', baseURL: string = 'https://www.yuque.com/api/v2') {
    // ... other services
    this.yourService = new YourService(apiToken, baseURL);
  }
  
  async newApiMethod(param: string) {
    return this.yourService.newApiMethod(param);
  }
}
```

4. **Register tool in `registerTools()` of `server.ts`**:
```typescript
this.server.tool(
  "tool_name",
  "Tool description in Chinese",
  {
    param: z.string().describe("Parameter description"),
    accessToken: z.string().optional().describe("Token for authenticating API requests"),
  },
  async ({ param, accessToken }) => {
    try {
      const yuqueService = this.createYuqueService(accessToken);
      const result = await yuqueService.newApiMethod(param);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);
```

3. **Update README documentation** with new tool description

### Code Standards

1. **Type Safety**:
   - Define TypeScript interfaces for all API responses
   - Use Zod to validate input parameters
   - Avoid using `any` type

2. **Error Handling**:
   - All tool methods must catch exceptions
   - Return user-friendly error messages
   - Use `Logger.error()` to log errors

3. **Naming Conventions**:
   - Class names: PascalCase (e.g., `YuqueMcpServer`)
   - Method names: camelCase (e.g., `getUserDocs`)
   - Tool names: snake_case (e.g., `get_user_docs`)
   - Constants: UPPER_SNAKE_CASE

4. **Documentation Strings**:
   - Tool descriptions in Chinese
   - Clear and explicit parameter descriptions
   - Include usage examples (in README)

### Debugging Tips

1. **Development Mode**:
   - Use `npm run dev` to start with auto-reload
   - Check console log output

2. **View API Calls**:
   - Add logs in `yuque.ts`
   - Use axios interceptors to view requests/responses

3. **Test Tool Calls**:
   - HTTP mode: Use Postman or curl to test `/sse` endpoint
   - Stdio mode: Integrate into MCP client for testing

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
- Project has implemented `splitDocumentContent()` method
- Automatically splits large documents into 100KB chunks
- Each chunk includes overlapping content to maintain context

### 2. API Token Not Set
- Server will output warning but won't exit
- Can provide token dynamically via query parameter
- Suitable for multi-user scenarios

### 3. CORS Issues (HTTP Mode)
- CORS middleware is already enabled
- Allows access from all origins

## Extension Suggestions

1. **Add Caching Mechanism**: Reduce API call frequency
2. **Implement WebSocket Support**: Provide real-time updates
3. **Add Rate Limiting**: Prevent API abuse
4. **Implement Batch Operations**: Improve efficiency
5. **Add Unit Tests**: Ensure code quality
6. **Support More Yuque APIs**: Such as comments, collaboration, etc.

## Related Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Yuque Open API Documentation](https://app.swaggerhub.com/apis-docs/Jeff-Tian/yuque-open_api/2.0.1)
- [Project GitHub Repository](https://github.com/Henryhaoson/Yueque-MCP-Server)
- [Smithery Installation Page](https://smithery.ai/server/@HenryHaoson/Yuque-MCP-Server)

---

**Last Updated**: January 5, 2026
