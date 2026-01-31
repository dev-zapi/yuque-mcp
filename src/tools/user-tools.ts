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
    "获取当前登录用户的语雀账号信息，包括用户ID、用户名、头像、邮箱等基本信息。用于确认当前身份或获取用户ID用于其他操作。",
    {
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
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
    "获取当前用户创建或参与的所有文档列表，包括个人知识库中的文档和协作知识库中的文档。返回文档标题、ID、所属知识库、更新时间等信息。",
    {
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
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
