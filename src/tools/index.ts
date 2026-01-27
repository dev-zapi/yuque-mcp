import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory } from "./types";
import { registerUserTools } from "./user-tools";
import { registerRepoTools } from "./repo-tools";
import { registerDocTools, splitDocumentContent } from "./doc-tools";
import { registerSearchTools } from "./search-tools";
import { registerStatsTools } from "./stats-tools";

// Re-export types and utilities
export { ServiceFactory, ToolResponse, DocChunk, ChunkInfo } from "./types";
export { splitDocumentContent } from "./doc-tools";

/**
 * Tool definition for display purposes
 */
export interface ToolDefinition {
  name: string;
  description: string;
}

/**
 * List of all available tools with their descriptions
 */
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: "get_current_user",
    description: "获取当前认证用户的信息，包括用户ID、用户名、头像等语雀账号基本信息",
  },
  {
    name: "get_user_docs",
    description: "获取当前用户的所有知识库文档列表，包括私人和协作文档",
  },
  {
    name: "get_user_repos",
    description: "获取指定用户的知识库列表，知识库是语雀中组织文档的集合",
  },
  {
    name: "get_repo_docs",
    description: "获取特定知识库中的所有文档列表，包括文档标题、更新时间等信息",
  },
  {
    name: "get_doc",
    description:
      "获取语雀中特定文档的详细内容，包括正文、修改历史和权限信息（支持分块处理大型文档）",
  },
  {
    name: "get_doc_chunks_info",
    description: "获取文档的分块元信息，包括总块数、每块的字符数等",
  },
  {
    name: "create_doc",
    description: "在指定知识库中创建新的语雀文档，支持多种格式内容",
  },
  {
    name: "update_doc",
    description: "更新语雀中已存在的文档，可以修改标题、内容或权限设置",
  },
  {
    name: "delete_doc",
    description: "从语雀知识库中删除指定文档，此操作不可撤销",
  },
  {
    name: "search",
    description: "在语雀平台中搜索文档或知识库内容，支持范围和作者筛选",
  },
  {
    name: "get_group_statistics",
    description: "获取团队的汇总统计数据，包括成员人数、文档数量、阅读量和互动数据等",
  },
  {
    name: "get_group_member_statistics",
    description: "获取团队成员的统计数据，包括各成员的编辑次数、阅读量、点赞量等",
  },
  {
    name: "get_group_book_statistics",
    description: "获取团队知识库的统计数据，包括各知识库的文档数、字数、阅读量等",
  },
  {
    name: "get_group_doc_statistics",
    description: "获取团队文档的统计数据，包括各文档的字数、阅读量、评论量等",
  },
];

/**
 * Register all Yuque MCP tools
 * @param server - The MCP server instance
 * @param createService - Factory function to create YuqueService instances
 */
export function registerAllTools(server: McpServer, createService: ServiceFactory): void {
  registerUserTools(server, createService);
  registerRepoTools(server, createService);
  registerDocTools(server, createService);
  registerSearchTools(server, createService);
  registerStatsTools(server, createService);
}

/**
 * Display available tools to the console
 */
export function displayAvailableTools(): void {
  console.log("\n======== 语雀 MCP 服务器可用工具 ========");
  console.log("以下工具可用于与语雀知识库交互：");
  console.log("----------------------------------------");

  AVAILABLE_TOOLS.forEach((tool) => {
    console.log(`\n• ${tool.name}`);
    console.log(`  ${tool.description}`);
  });

  console.log("\n========================================\n");
}
