import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory, ToolResponse } from "./types";
import { Logger } from "../server";

/**
 * Register user-related tools
 */
export function registerUserTools(server: McpServer, createService: ServiceFactory): void {
  // Tool to get current user information
  server.tool(
    "get_current_user",
    "获取当前认证用户的信息，包括用户ID、用户名、头像等语雀账号基本信息",
    {
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async ({ accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log("Fetching current user information");
        const yuqueService = createService(accessToken);
        const user = await yuqueService.getCurrentUser();

        Logger.log(`Successfully fetched user: ${user.name}`);
        return {
          content: [{ type: "text", text: JSON.stringify(user) }],
        };
      } catch (error) {
        Logger.error("Error fetching current user:", error);
        return {
          content: [{ type: "text", text: `Error fetching current user: ${error}` }],
        };
      }
    }
  );

  // Tool to get user's docs
  server.tool(
    "get_user_docs",
    "获取当前用户的所有知识库文档列表，包括私人和协作文档",
    {
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async ({ accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log("Fetching user's documents");
        const yuqueService = createService(accessToken);
        const docs = await yuqueService.getUserDocs();

        Logger.log(`Successfully fetched ${docs.length} documents`);
        return {
          content: [{ type: "text", text: JSON.stringify(docs) }],
        };
      } catch (error) {
        Logger.error("Error fetching user docs:", error);
        return {
          content: [{ type: "text", text: `Error fetching user docs: ${error}` }],
        };
      }
    }
  );
}
