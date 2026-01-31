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
    "获取语雀团队的汇总统计数据，包括成员总数、文档总数、总阅读量、点赞数等核心指标。适合快速了解团队整体活跃度和内容规模。",
    {
      login: z
        .string()
        .describe("团队的登录名或ID。可在团队主页URL中找到，例如 yuque.com/my-team 中的 my-team"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
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
    "获取团队成员的详细统计数据，包括各成员的文档创建数、编辑次数、阅读量、点赞数等。支持按时间范围、排序方式筛选，便于分析成员活跃度和贡献度。",
    {
      login: z.string().describe("团队的登录名或ID。可在团队主页URL中找到"),
      name: z
        .string()
        .optional()
        .describe("成员名称筛选。传入成员用户名或昵称，仅返回匹配的成员统计"),
      range: z
        .number()
        .optional()
        .describe("统计时间范围：0=全部历史，30=近30天，365=近一年。默认全部"),
      page: z.number().optional().describe("分页页码，从1开始。用于浏览大量成员，默认第1页"),
      limit: z.number().optional().describe("每页返回数量，默认10条，最大20条"),
      sortField: z
        .string()
        .optional()
        .describe(
          "排序字段，可选：write_doc_count（发文数）、write_count（编辑次数）、read_count（阅读量）、like_count（点赞数）"
        ),
      sortOrder: z
        .enum(["desc", "asc"])
        .optional()
        .describe("排序方向：desc=降序（从高到低，默认），asc=升序（从低到高）"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
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
    "获取团队各知识库的详细统计数据，包括每个知识库的文档数量、总字数、阅读量、点赞数、关注数、评论数等。支持按名称筛选和多种排序方式。",
    {
      login: z.string().describe("团队的登录名或ID。可在团队主页URL中找到"),
      name: z
        .string()
        .optional()
        .describe("知识库名称筛选。传入知识库名称关键词，仅返回匹配的知识库统计"),
      range: z
        .number()
        .optional()
        .describe("统计时间范围：0=全部历史，30=近30天，365=近一年。默认全部"),
      page: z.number().optional().describe("分页页码，从1开始。用于浏览大量知识库，默认第1页"),
      limit: z.number().optional().describe("每页返回数量，默认10条，最大20条"),
      sortField: z
        .string()
        .optional()
        .describe(
          "排序字段，可选：content_updated_at_ms（更新时间）、word_count（字数）、post_count（文档数）、read_count（阅读量）、like_count（点赞数）、watch_count（关注数）、comment_count（评论数）"
        ),
      sortOrder: z
        .enum(["desc", "asc"])
        .optional()
        .describe("排序方向：desc=降序（从高到低，默认），asc=升序（从低到高）"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
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
    "获取团队文档的详细统计数据，包括各文档的字数、阅读量、点赞数、评论数、创建时间等。支持按知识库、文档名称筛选和多种排序方式，便于发现热门文档或分析内容表现。",
    {
      login: z.string().describe("团队的登录名或ID。可在团队主页URL中找到"),
      bookId: z
        .number()
        .optional()
        .describe("知识库ID筛选。传入知识库ID，仅返回该知识库下的文档统计"),
      name: z
        .string()
        .optional()
        .describe("文档名称筛选。传入文档标题关键词，仅返回匹配的文档统计"),
      range: z
        .number()
        .optional()
        .describe("统计时间范围：0=全部历史，30=近30天，365=近一年。默认全部"),
      page: z.number().optional().describe("分页页码，从1开始。用于浏览大量文档，默认第1页"),
      limit: z.number().optional().describe("每页返回数量，默认10条，最大20条"),
      sortField: z
        .string()
        .optional()
        .describe(
          "排序字段，可选：content_updated_at（更新时间）、word_count（字数）、read_count（阅读量）、like_count（点赞数）、comment_count（评论数）、created_at（创建时间）"
        ),
      sortOrder: z
        .enum(["desc", "asc"])
        .optional()
        .describe("排序方向：desc=降序（从高到低，默认），asc=升序（从低到高）"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
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
