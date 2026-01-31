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
    "在语雀平台中搜索文档或知识库。支持关键词搜索，可按作者、范围筛选。适合快速查找相关内容而无需遍历所有知识库。",
    {
      query: z.string().describe('搜索关键词。支持多个关键词，空格分隔。例如："API 文档"'),
      type: z.enum(["doc", "repo"]).describe("搜索类型：doc=搜索文档，repo=搜索知识库"),
      scope: z
        .string()
        .optional()
        .describe("搜索范围限定。例如指定团队名或用户名，不填则搜索当前用户有权限的所有内容"),
      page: z.number().optional().describe("分页页码，从1开始。用于浏览大量搜索结果，默认第1页"),
      creator: z
        .string()
        .optional()
        .describe("按作者筛选。传入作者的用户名，仅返回该作者创建的内容"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
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
