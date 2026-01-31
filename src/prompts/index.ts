import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServiceFactory } from "../tools/types";

/**
 * Prompt definition for display purposes
 */
export interface PromptDefinition {
  name: string;
  title: string;
  description: string;
}

/**
 * List of all available prompts with their descriptions
 */
export const AVAILABLE_PROMPTS: PromptDefinition[] = [
  {
    name: "analyze_yuque_doc",
    title: "分析语雀文档",
    description: "帮助分析语雀文档的内容，提供摘要、关键点和改进建议",
  },
  {
    name: "create_yuque_doc",
    title: "创建语雀文档",
    description: "协助创建结构化的语雀文档，提供格式建议和最佳实践",
  },
  {
    name: "search_yuque",
    title: "搜索语雀内容",
    description: "帮助在语雀中搜索和整理信息，提供搜索策略建议",
  },
  {
    name: "yuque_writing_assistant",
    title: "语雀写作助手",
    description: "提供语雀文档写作建议，包括格式、结构和内容优化",
  },
  {
    name: "yuque_knowledge_base_guide",
    title: "语雀知识库管理指南",
    description: "提供语雀知识库组织和管理的最佳实践建议",
  },
];

/**
 * Register all Yuque MCP prompts
 * @param server - The MCP server instance
 * @param createService - Factory function to create YuqueService instances
 */
export function registerAllPrompts(server: McpServer, createService: ServiceFactory): void {
  // 注册分析语雀文档的prompt
  server.registerPrompt(
    "analyze_yuque_doc",
    {
      title: "分析语雀文档",
      description: "帮助分析语雀文档的内容，提供摘要、关键点和改进建议",
      argsSchema: {
        docContent: z.string().describe("文档内容"),
        docTitle: z.string().optional().describe("文档标题"),
        analysisType: z
          .enum(["summary", "key_points", "improvements", "full"])
          .optional()
          .describe(
            "分析类型：summary(摘要)、key_points(关键点)、improvements(改进建议)、full(完整分析)"
          ),
      },
    },
    async ({ docContent, docTitle, analysisType = "full" }) => {
      const title = docTitle || "未命名文档";

      let systemPrompt = `你是一位专业的文档分析助手。请分析以下语雀文档内容。\n\n`;
      systemPrompt += `文档标题：${title}\n\n`;
      systemPrompt += `文档内容：\n${docContent}\n\n`;

      switch (analysisType) {
        case "summary":
          systemPrompt += `请提供文档的简明摘要（200字以内）。`;
          break;
        case "key_points":
          systemPrompt += `请提取文档的3-5个关键要点。`;
          break;
        case "improvements":
          systemPrompt += `请提供3-5条改进建议，包括结构、内容和格式方面的建议。`;
          break;
        case "full":
        default:
          systemPrompt += `请提供：\n1. 文档摘要（200字以内）\n2. 关键要点（3-5条）\n3. 改进建议（3-5条）\n4. 适合的目标读者\n5. 文档质量评分（1-10分）`;
          break;
      }

      return {
        description: `分析文档：${title}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: systemPrompt,
            },
          },
        ],
      };
    }
  );

  // 注册创建语雀文档的prompt
  server.registerPrompt(
    "create_yuque_doc",
    {
      title: "创建语雀文档",
      description: "协助创建结构化的语雀文档，提供格式建议和最佳实践",
      argsSchema: {
        topic: z.string().describe("文档主题"),
        docType: z
          .enum(["tutorial", "reference", "api_doc", "meeting_notes", "project_plan", "other"])
          .describe("文档类型"),
        targetAudience: z.string().optional().describe("目标受众"),
        keyPoints: z.string().optional().describe("需要涵盖的关键点（用逗号分隔）"),
        tone: z.enum(["formal", "casual", "technical", "friendly"]).optional().describe("语气风格"),
      },
    },
    async ({ topic, docType, targetAudience, keyPoints, tone = "friendly" }) => {
      const toneMap: Record<string, string> = {
        formal: "正式专业",
        casual: "轻松随意",
        technical: "技术严谨",
        friendly: "友好亲切",
      };

      const typeMap: Record<string, string> = {
        tutorial: "教程文档",
        reference: "参考文档",
        api_doc: "API文档",
        meeting_notes: "会议纪要",
        project_plan: "项目计划",
        other: "其他类型",
      };

      let systemPrompt = `你是一位专业的技术写作专家。请协助创建一篇语雀文档。\n\n`;
      systemPrompt += `文档主题：${topic}\n`;
      systemPrompt += `文档类型：${typeMap[docType]}\n`;
      systemPrompt += `语气风格：${toneMap[tone]}\n`;

      if (targetAudience) {
        systemPrompt += `目标受众：${targetAudience}\n`;
      }

      if (keyPoints) {
        systemPrompt += `关键点：${keyPoints}\n`;
      }

      systemPrompt += `\n请提供：\n`;
      systemPrompt += `1. 建议的文档标题\n`;
      systemPrompt += `2. 文档大纲结构（使用Markdown格式）\n`;
      systemPrompt += `3. 每个章节的简要说明\n`;
      systemPrompt += `4. 语雀特有的格式建议（如使用表格、代码块、引用等）\n`;
      systemPrompt += `5. 写作注意事项和最佳实践\n`;

      return {
        description: `创建文档：${topic}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: systemPrompt,
            },
          },
        ],
      };
    }
  );

  // 注册搜索语雀内容的prompt
  server.registerPrompt(
    "search_yuque",
    {
      title: "搜索语雀内容",
      description: "帮助在语雀中搜索和整理信息，提供搜索策略建议",
      argsSchema: {
        query: z.string().describe("搜索关键词或问题"),
        searchScope: z
          .enum(["docs", "repos", "both"])
          .optional()
          .describe("搜索范围：docs(文档)、repos(知识库)、both(两者)"),
        context: z.string().optional().describe("搜索背景或目的"),
      },
    },
    async ({ query, searchScope = "both", context }) => {
      let systemPrompt = `你是一位信息检索专家。请帮助制定语雀搜索策略。\n\n`;
      systemPrompt += `搜索关键词/问题：${query}\n`;
      systemPrompt += `搜索范围：${searchScope === "docs" ? "文档" : searchScope === "repos" ? "知识库" : "文档和知识库"}\n`;

      if (context) {
        systemPrompt += `搜索背景：${context}\n`;
      }

      systemPrompt += `\n请提供：\n`;
      systemPrompt += `1. 优化的搜索关键词建议（3-5个变体）\n`;
      systemPrompt += `2. 推荐的搜索策略和技巧\n`;
      systemPrompt += `3. 如何筛选和评估搜索结果\n`;
      systemPrompt += `4. 如果搜索结果不理想，可以尝试的替代方案\n`;
      systemPrompt += `5. 使用语雀搜索功能的最佳实践\n`;

      return {
        description: `搜索策略：${query}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: systemPrompt,
            },
          },
        ],
      };
    }
  );

  // 注册语雀写作助手的prompt
  server.registerPrompt(
    "yuque_writing_assistant",
    {
      title: "语雀写作助手",
      description: "提供语雀文档写作建议，包括格式、结构和内容优化",
      argsSchema: {
        content: z.string().describe("当前写作内容"),
        writingGoal: z.string().optional().describe("写作目标"),
        section: z
          .enum(["introduction", "body", "conclusion", "full"])
          .optional()
          .describe("当前写作部分"),
      },
    },
    async ({ content, writingGoal, section = "full" }) => {
      const sectionMap: Record<string, string> = {
        introduction: "引言部分",
        body: "正文部分",
        conclusion: "结论部分",
        full: "全文",
      };

      let systemPrompt = `你是一位专业的语雀写作助手。请为以下${sectionMap[section]}提供写作建议。\n\n`;
      systemPrompt += `当前内容：\n${content}\n\n`;

      if (writingGoal) {
        systemPrompt += `写作目标：${writingGoal}\n\n`;
      }

      systemPrompt += `请提供：\n`;
      systemPrompt += `1. 内容分析和评价\n`;
      systemPrompt += `2. 具体的改进建议（包括措辞、结构、逻辑）\n`;
      systemPrompt += `3. 语雀Markdown格式建议\n`;
      systemPrompt += `4. 改进后的版本示例\n`;
      systemPrompt += `5. 写作技巧和最佳实践\n`;

      return {
        description: `写作建议：${sectionMap[section]}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: systemPrompt,
            },
          },
        ],
      };
    }
  );

  // 注册语雀知识库管理指南的prompt
  server.registerPrompt(
    "yuque_knowledge_base_guide",
    {
      title: "语雀知识库管理指南",
      description: "提供语雀知识库组织和管理的最佳实践建议",
      argsSchema: {
        currentStructure: z.string().optional().describe("当前知识库结构描述"),
        goal: z.enum(["organize", "optimize", "migrate", "create_new"]).describe("管理目标"),
        teamSize: z.enum(["solo", "small", "medium", "large"]).optional().describe("团队规模"),
      },
    },
    async ({ currentStructure, goal, teamSize = "small" }) => {
      const goalMap: Record<string, string> = {
        organize: "整理现有知识库",
        optimize: "优化知识库结构",
        migrate: "迁移知识库",
        create_new: "创建新知识库",
      };

      const teamMap: Record<string, string> = {
        solo: "个人",
        small: "小团队（2-10人）",
        medium: "中等团队（11-50人）",
        large: "大团队（50人以上）",
      };

      let systemPrompt = `你是一位知识管理专家。请提供语雀知识库管理建议。\n\n`;
      systemPrompt += `管理目标：${goalMap[goal]}\n`;
      systemPrompt += `团队规模：${teamMap[teamSize]}\n`;

      if (currentStructure) {
        systemPrompt += `当前结构：${currentStructure}\n`;
      }

      systemPrompt += `\n请提供：\n`;

      switch (goal) {
        case "organize":
          systemPrompt += `1. 知识库整理步骤和流程\n`;
          systemPrompt += `2. 文档分类和标签建议\n`;
          systemPrompt += `3. 目录结构优化方案\n`;
          break;
        case "optimize":
          systemPrompt += `1. 现有结构分析\n`;
          systemPrompt += `2. 优化建议和方案\n`;
          systemPrompt += `3. 权限管理建议\n`;
          break;
        case "migrate":
          systemPrompt += `1. 迁移计划和步骤\n`;
          systemPrompt += `2. 数据备份建议\n`;
          systemPrompt += `3. 迁移后的验证检查清单\n`;
          break;
        case "create_new":
          systemPrompt += `1. 知识库架构设计建议\n`;
          systemPrompt += `2. 初始内容规划\n`;
          systemPrompt += `3. 权限和协作设置建议\n`;
          break;
      }

      systemPrompt += `4. 长期维护和管理建议\n`;
      systemPrompt += `5. 团队协作最佳实践\n`;

      return {
        description: `知识库管理：${goalMap[goal]}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: systemPrompt,
            },
          },
        ],
      };
    }
  );
}

/**
 * Display available prompts to the console
 */
export function displayAvailablePrompts(): void {
  console.log("\n======== 语雀 MCP 服务器可用 Prompts ========");
  console.log("以下Prompts可用于辅助语雀文档操作：");
  console.log("---------------------------------------------");

  AVAILABLE_PROMPTS.forEach((prompt) => {
    console.log(`\n• ${prompt.name}`);
    console.log(`  标题：${prompt.title}`);
    console.log(`  描述：${prompt.description}`);
  });

  console.log("\n=============================================\n");
}
