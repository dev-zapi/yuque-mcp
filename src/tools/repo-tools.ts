import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory, ToolResponse } from "./types";
import { Logger } from "../server";

/**
 * Register repository-related tools
 */
export function registerRepoTools(server: McpServer, createService: ServiceFactory): void {
  // Tool to get user's repos
  server.tool(
    "get_user_repos",
    "获取指定用户的所有知识库（文档库）列表。知识库是语雀中组织文档的容器，每个知识库包含多篇文档。获取后可用于进一步获取库内文档列表。",
    {
      login: z
        .string()
        .describe("用户的登录名或ID。可在语雀个人主页URL中找到，例如 yuque.com/john 中的 john"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({ login, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Fetching repositories for user: ${login}`);
        const yuqueService = createService(accessToken);
        const repos = await yuqueService.getUserRepos(login);

        Logger.log(`Successfully fetched ${repos.length} repositories`);
        return {
          content: [{ type: "text", text: JSON.stringify(repos, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching repos for user ${login}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching repos: ${error}` }],
        };
      }
    }
  );

  // Tool to get docs in a repo
  server.tool(
    "get_repo_docs",
    "获取指定知识库中的所有文档列表，包含文档标题、ID、更新时间、作者等信息。获取文档ID后可用于获取文档详情或更新/删除文档。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({ namespace, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Fetching documents for repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const docs = await yuqueService.getRepoDocs(namespace);

        Logger.log(`Successfully fetched ${docs.length} documents`);
        return {
          content: [{ type: "text", text: JSON.stringify(docs, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching docs for repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching docs: ${error}` }],
        };
      }
    }
  );
}
