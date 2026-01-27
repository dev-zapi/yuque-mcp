import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory, ToolResponse } from "./types";
import { Logger } from "../server";

/**
 * Register statistics-related tools
 */
export function registerStatsTools(server: McpServer, createService: ServiceFactory): void {
  // Tool to get group statistics summary
  server.tool(
    "get_group_statistics",
    "获取团队的汇总统计数据，包括成员人数、文档数量、阅读量和互动数据等",
    {
      login: z.string().describe("团队的登录名或唯一标识"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async ({ login, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Fetching statistics for group: ${login}`);
        const yuqueService = createService(accessToken);
        const stats = await yuqueService.getGroupStatistics(login);

        Logger.log(`Successfully fetched statistics for group: ${login}`);
        return {
          content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching statistics for group ${login}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching group statistics: ${error}` }],
        };
      }
    }
  );

  // Tool to get group member statistics
  server.tool(
    "get_group_member_statistics",
    "获取团队成员的统计数据，包括各成员的编辑次数、阅读量、点赞量等",
    {
      login: z.string().describe("团队的登录名或唯一标识"),
      name: z.string().optional().describe("成员名称，用于过滤特定成员"),
      range: z.number().optional().describe("时间范围（0: 全部, 30: 近30天, 365: 近一年）"),
      page: z.number().optional().describe("页码，默认为1"),
      limit: z.number().optional().describe("每页数量，默认为10，最大为20"),
      sortField: z
        .string()
        .optional()
        .describe("排序字段，可选值：write_doc_count、write_count、read_count、like_count"),
      sortOrder: z
        .enum(["desc", "asc"])
        .optional()
        .describe("排序方向，可选值：desc（降序）、asc（升序），默认为desc"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async (params): Promise<ToolResponse> => {
      try {
        const { login, accessToken, ...queryParams } = params;
        Logger.log(`Fetching member statistics for group: ${login}`);
        const yuqueService = createService(accessToken);
        const stats = await yuqueService.getGroupMemberStatistics(login, queryParams);

        Logger.log(`Successfully fetched member statistics for group: ${login}`);
        return {
          content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching member statistics for group ${params.login}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching group member statistics: ${error}` }],
        };
      }
    }
  );

  // Tool to get group book/repository statistics
  server.tool(
    "get_group_book_statistics",
    "获取团队知识库的统计数据，包括各知识库的文档数、字数、阅读量等",
    {
      login: z.string().describe("团队的登录名或唯一标识"),
      name: z.string().optional().describe("知识库名称，用于过滤特定知识库"),
      range: z.number().optional().describe("时间范围（0: 全部, 30: 近30天, 365: 近一年）"),
      page: z.number().optional().describe("页码，默认为1"),
      limit: z.number().optional().describe("每页数量，默认为10，最大为20"),
      sortField: z
        .string()
        .optional()
        .describe(
          "排序字段，可选值：content_updated_at_ms、word_count、post_count、read_count、like_count、watch_count、comment_count"
        ),
      sortOrder: z
        .enum(["desc", "asc"])
        .optional()
        .describe("排序方向，可选值：desc（降序）、asc（升序），默认为desc"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async (params): Promise<ToolResponse> => {
      try {
        const { login, accessToken, ...queryParams } = params;
        Logger.log(`Fetching book statistics for group: ${login}`);
        const yuqueService = createService(accessToken);
        const stats = await yuqueService.getGroupBookStatistics(login, queryParams);

        Logger.log(`Successfully fetched book statistics for group: ${login}`);
        return {
          content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching book statistics for group ${params.login}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching group book statistics: ${error}` }],
        };
      }
    }
  );

  // Tool to get group document statistics
  server.tool(
    "get_group_doc_statistics",
    "获取团队文档的统计数据，包括各文档的字数、阅读量、评论量等",
    {
      login: z.string().describe("团队的登录名或唯一标识"),
      bookId: z.number().optional().describe("知识库ID，用于过滤特定知识库的文档"),
      name: z.string().optional().describe("文档名称，用于过滤特定文档"),
      range: z.number().optional().describe("时间范围（0: 全部, 30: 近30天, 365: 近一年）"),
      page: z.number().optional().describe("页码，默认为1"),
      limit: z.number().optional().describe("每页数量，默认为10，最大为20"),
      sortField: z
        .string()
        .optional()
        .describe(
          "排序字段，可选值：content_updated_at、word_count、read_count、like_count、comment_count、created_at"
        ),
      sortOrder: z
        .enum(["desc", "asc"])
        .optional()
        .describe("排序方向，可选值：desc（降序）、asc（升序），默认为desc"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async (params): Promise<ToolResponse> => {
      try {
        const { login, accessToken, ...queryParams } = params;
        Logger.log(`Fetching doc statistics for group: ${login}`);
        const yuqueService = createService(accessToken);
        const stats = await yuqueService.getGroupDocStatistics(login, queryParams);

        Logger.log(`Successfully fetched doc statistics for group: ${login}`);
        return {
          content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching doc statistics for group ${params.login}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching group doc statistics: ${error}` }],
        };
      }
    }
  );
}
