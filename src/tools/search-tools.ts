import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory, ToolResponse } from "./types";
import { Logger } from "../server";

/**
 * Register search-related tools
 */
export function registerSearchTools(server: McpServer, createService: ServiceFactory): void {
  // Tool to search Yuque content
  server.tool(
    "search",
    "在语雀平台中搜索文档或知识库内容，支持范围和作者筛选",
    {
      query: z.string().describe("搜索关键词"),
      type: z.enum(["doc", "repo"]).describe("要搜索的内容类型：doc(文档) 或 repo(知识库)"),
      scope: z.string().optional().describe("搜索范围，不填默认搜索当前用户/团队"),
      page: z.number().optional().describe("页码，默认为1"),
      creator: z.string().optional().describe("仅搜索指定作者的内容"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async ({ query, type, scope, page, creator, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Searching for: ${query} with type: ${type}`);
        const yuqueService = createService(accessToken);
        const results = await yuqueService.search(query, type, scope, page, creator);

        Logger.log(`Successfully found ${results.length} results`);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error searching for ${query}:`, error);
        return {
          content: [{ type: "text", text: `Error searching: ${error}` }],
        };
      }
    }
  );
}
