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
    "获取指定用户的知识库列表，知识库是语雀中组织文档的集合",
    {
      login: z.string().describe("用户的登录名或唯一标识"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
    "获取特定知识库中的所有文档列表，包括文档标题、更新时间等信息",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
