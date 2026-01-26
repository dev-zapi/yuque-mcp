# AGENTS.md - AI Coding Agent Instructions

This file provides guidance for AI coding agents working in the Yuque MCP Server codebase.

## Project Overview

A Yuque API integration server implementing Model Context Protocol (MCP). TypeScript-based, supports stdio and HTTP modes. Enables AI models to interact with Yuque knowledge base platform.

## Build/Lint/Test Commands

### Build
```bash
npm run build          # Compile TypeScript to dist/
npm run type-check     # Type-check without emitting files
```

### Development
```bash
npm run dev            # HTTP mode with hot reload
npm run dev:cli        # Stdio/CLI mode with hot reload
```

### Production
```bash
npm run start          # HTTP mode (requires build first)
npm run start:cli      # Stdio/CLI mode (requires build first)
```

### Testing
**No test framework is currently configured.** When tests are added:
- Place test files in `test/` or alongside source as `*.test.ts`
- Run single test: `npx jest path/to/file.test.ts` (once Jest is configured)

### Linting
**No ESLint/Prettier configured.** Follow code style guidelines manually.

## Code Style Guidelines

### Formatting
- **Indentation**: 2 spaces
- **Quotes**: Double quotes (`"`) for strings
- **Semicolons**: Required at end of statements
- **Trailing commas**: Use in multi-line objects/arrays
- **Braces**: Opening brace on same line (K&R style)

### Import Order
1. External packages (npm modules)
2. Internal imports (from `./` paths)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YuqueService } from "./services/yuque";
import express, { Request, Response } from "express";
```

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files | lowercase, dots/underscores | `mcp_hook.ts`, `types.ts` |
| Classes | PascalCase | `YuqueMcpServer`, `DocumentService` |
| Interfaces | PascalCase with Yuque prefix | `YuqueUser`, `YuqueDoc` |
| Functions/Methods | camelCase | `getUserDocs()`, `createDoc()` |
| Constants | UPPER_SNAKE_CASE | `MAXIMUM_MESSAGE_SIZE` |
| MCP Tool names | snake_case | `get_current_user`, `create_doc` |

### TypeScript Types
- **Strict mode enabled** - respect all strict checks
- Define interfaces in `src/services/types.ts` for API responses
- Use Zod for runtime validation of inputs
- Avoid `any` type; use specific types or generics; mark optional properties with `?`

### Error Handling Pattern
All MCP tool handlers must follow this pattern:

```typescript
async ({ param, accessToken }) => {
  try {
    Logger.log(`Operation description: ${param}`);
    const yuqueService = this.createYuqueService(accessToken);
    const result = await yuqueService.someMethod(param);
    
    Logger.log(`Success message`);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    Logger.error(`Error description:`, error);
    return {
      content: [{ type: "text", text: `Error: ${error}` }],
    };
  }
}
```

## Project Architecture

```
src/
├── index.ts           # Entry point, mode detection
├── cli.ts             # CLI mode entry (shebang script)
├── server.ts          # YuqueMcpServer class, tool registration
├── config.ts          # Zod-validated configuration
├── mcp_hook.ts        # HTTP mode request/response hooks
└── services/
    ├── types.ts       # All TypeScript interfaces
    └── yuque/         # Service modules (user, group, repo, document, toc, search, statistics)
        └── index.ts   # Main YuqueService (facade pattern)
```

## Adding New Features

1. **Add API method in appropriate service** (`src/services/yuque/*.ts`):
```typescript
async newMethod(param: string): Promise<YourType> {
  const response = await this.client.get(`/endpoint/${param}`);
  return response.data.data;
}
```

2. **Expose method in YuqueService** (`src/services/yuque/index.ts`):
```typescript
async newMethod(param: string) {
  return this.yourService.newMethod(param);
}
```

3. **Register tool in server.ts** `registerTools()`:
```typescript
this.server.tool(
  "tool_name",           // snake_case
  "中文工具描述",         // Chinese description
  { param: z.string().describe("参数描述"), accessToken: z.string().optional() },
  async ({ param, accessToken }) => { /* Use error handling pattern above */ }
);
```

4. **Update README** with new tool documentation

## Configuration

Environment variables (validated via Zod in `config.ts`):
- `PORT` - HTTP server port (default: 3000)
- `YUQUE_API_TOKEN` - Yuque API authentication token
- `YUQUE_API_BASE_URL` - API base URL (default: https://www.yuque.com/api/v2)

## Important Notes

1. **Tool descriptions in Chinese** - maintain this convention
2. **No tests exist** - consider adding when modifying critical code
3. **No linting** - manually follow style guidelines
4. **Large documents** - use `splitDocumentContent()` for chunking
5. **HTTP mode** - supports SSE at `/sse` endpoint with query params

## Related Documentation

- `.github/copilot-instructions.md` - Detailed development guide
- `README.md` / `README.en.md` - User documentation
- [MCP Documentation](https://modelcontextprotocol.io)
- [Yuque API Docs](https://app.swaggerhub.com/apis-docs/Jeff-Tian/yuque-open_api/2.0.1)