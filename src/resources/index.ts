import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory } from "../tools/types";
import { Logger } from "../server";

/**
 * Resource definition for display purposes
 */
export interface ResourceDefinition {
  uri: string;
  name: string;
  title: string;
  description: string;
  mimeType?: string;
}

/**
 * List of all available static resources
 */
export const AVAILABLE_RESOURCES: ResourceDefinition[] = [
  {
    uri: "yuque://docs/writing-guide",
    name: "yuque-writing-guide",
    title: "语雀写作指南",
    description: "语雀文档写作的最佳实践和格式指南",
    mimeType: "text/markdown",
  },
  {
    uri: "yuque://docs/markdown-cheatsheet",
    name: "yuque-markdown-cheatsheet",
    title: "语雀 Markdown 速查表",
    description: "语雀支持的 Markdown 语法速查表",
    mimeType: "text/markdown",
  },
  {
    uri: "yuque://docs/api-quickstart",
    name: "yuque-api-quickstart",
    title: "语雀 API 快速入门",
    description: "语雀 API 使用快速入门指南",
    mimeType: "text/markdown",
  },
];

/**
 * List of all available resource templates
 */
export const AVAILABLE_RESOURCE_TEMPLATES: ResourceDefinition[] = [
  {
    uri: "yuque://repos/{namespace}",
    name: "yuque-repo-info",
    title: "语雀知识库信息",
    description: "获取指定语雀知识库的详细信息",
    mimeType: "application/json",
  },
  {
    uri: "yuque://docs/{namespace}/{slug}",
    name: "yuque-doc-content",
    title: "语雀文档内容",
    description: "获取指定语雀文档的完整内容",
    mimeType: "text/markdown",
  },
  {
    uri: "yuque://toc/{namespace}",
    name: "yuque-repo-toc",
    title: "语雀知识库目录",
    description: "获取指定语雀知识库的目录结构",
    mimeType: "application/json",
  },
];

// 静态资源内容
const STATIC_RESOURCES: Record<string, string> = {
  "yuque://docs/writing-guide": `# 语雀写作指南

## 文档结构建议

### 1. 标题层级
- 使用一级标题 (#) 作为文档主标题
- 使用二级标题 (##) 作为主要章节
- 使用三级标题 (###) 作为小节
- 避免使用过深的标题层级（超过四级）

### 2. 文档开头
每个文档应该包含：
- 清晰的标题
- 简要的文档说明
- 目标读者
- 版本信息（如适用）

### 3. 内容组织
- 使用列表和表格来组织信息
- 适当使用引用块强调重要内容
- 代码块应该标注语言类型

## 格式规范

### Markdown 基础
- **粗体**：用于强调重要内容
- *斜体*：用于术语或引用
- \`代码\`：用于行内代码或命令
- [链接](url)：用于引用外部资源

### 语雀特有功能
- 使用 "> " 创建引用块
- 使用 "> [!NOTE]" 创建提示框
- 使用 "> [!WARNING]" 创建警告框
- 使用 "> [!TIP]" 创建技巧提示

## 最佳实践

1. **保持简洁**：段落不宜过长，建议每段不超过5行
2. **使用示例**：通过具体示例说明抽象概念
3. **添加目录**：长文档应该添加目录
4. **定期更新**：保持文档内容的时效性
5. **协作规范**：明确文档的编辑权限和审核流程

## 文档模板示例

\`\`\`markdown
# 文档标题

> 文档简介：简要说明本文档的目的和内容

**目标读者**：xxx  
**最后更新**：YYYY-MM-DD

## 目录

- [概述](#概述)
- [详细内容](#详细内容)
- [总结](#总结)

## 概述

...

## 详细内容

...

## 总结

...
\`\`\`
`,

  "yuque://docs/markdown-cheatsheet": `# 语雀 Markdown 速查表

## 基础语法

### 标题
\`\`\`markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
\`\`\`

### 文本样式
\`\`\`markdown
**粗体文本**
*斜体文本*
~~删除线~~
**_粗斜体_**
\`\`\`

### 列表
\`\`\`markdown
- 无序列表项
- 另一个项
  - 嵌套项
  - 嵌套项

1. 有序列表项
2. 第二个项
   1. 嵌套项
   2. 嵌套项
\`\`\`

### 链接和图片
\`\`\`markdown
[链接文本](https://example.com)
![图片描述](https://example.com/image.png)
\`\`\`

### 代码
\`\`\`markdown
行内代码：\`const x = 1\`

代码块：
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`
\`\`\`

## 扩展语法

### 表格
\`\`\`markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |
\`\`\`

### 引用
\`\`\`markdown
> 这是一段引用文本

> [!NOTE]
> 这是一个提示框

> [!WARNING]
> 这是一个警告框

> [!TIP]
> 这是一个技巧提示
\`\`\`

### 任务列表
\`\`\`markdown
- [x] 已完成任务
- [ ] 未完成任务
- [ ] 另一个未完成任务
\`\`\`

### 数学公式
\`\`\`markdown
行内公式：$E = mc^2$

块级公式：
$$
\\frac{d}{dx}e^x = e^x
$$
\`\`\`

## 语雀特有功能

### 画板
使用 "/draw" 快速插入画板

### 表格增强
- 支持合并单元格
- 支持表格内嵌套

### 思维导图
使用 "/mindmap" 快速插入思维导图

## 快捷键

| 功能 | Windows/Linux | Mac |
|------|---------------|-----|
| 加粗 | Ctrl+B | Cmd+B |
| 斜体 | Ctrl+I | Cmd+I |
| 插入链接 | Ctrl+K | Cmd+K |
| 插入代码块 | Ctrl+Shift+C | Cmd+Shift+C |
| 全屏编辑 | F11 | F11 |
`,

  "yuque://docs/api-quickstart": `# 语雀 API 快速入门

## 获取 API Token

1. 登录语雀官网：https://www.yuque.com
2. 进入「设置」→「账户管理」→「Token」
3. 点击「新建 Token」，输入名称并选择权限
4. 复制生成的 Token（注意：Token 只显示一次）

## API 基础信息

- **Base URL**: https://www.yuque.com/api/v2
- **认证方式**: Header 中携带 \`X-Auth-Token\`
- **数据格式**: JSON

## 快速示例

### 获取当前用户信息

\`\`\`bash
curl -H "X-Auth-Token: YOUR_TOKEN" \
  https://www.yuque.com/api/v2/user
\`\`\`

### 获取知识库列表

\`\`\`bash
curl -H "X-Auth-Token: YOUR_TOKEN" \
  https://www.yuque.com/api/v2/users/YOUR_LOGIN/repos
\`\`\`

### 获取文档内容

\`\`\`bash
curl -H "X-Auth-Token: YOUR_TOKEN" \
  https://www.yuque.com/api/v2/repos/NAMESPACE/docs/SLUG
\`\`\`

### 创建文档

\`\`\`bash
curl -X POST \
  -H "X-Auth-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新文档标题",
    "slug": "new-doc-slug",
    "body": "文档内容"
  }' \
  https://www.yuque.com/api/v2/repos/NAMESPACE/docs
\`\`\`

## 常用端点

| 端点 | 方法 | 描述 |
|------|------|------|
| /user | GET | 获取当前用户信息 |
| /users/:login/repos | GET | 获取用户知识库 |
| /repos/:namespace | GET | 获取知识库详情 |
| /repos/:namespace/docs | GET | 获取知识库文档列表 |
| /repos/:namespace/docs/:slug | GET | 获取文档详情 |
| /repos/:namespace/docs | POST | 创建文档 |
| /repos/:namespace/docs/:id | PUT | 更新文档 |
| /repos/:namespace/docs/:id | DELETE | 删除文档 |

## 注意事项

1. **频率限制**: 默认每个 Token 每分钟 500 次请求
2. **Token 安全**: 不要将 Token 硬编码在代码中，使用环境变量
3. **错误处理**: API 会返回标准的 HTTP 状态码和错误信息
4. **文档格式**: 支持 markdown、html、lake 三种格式

## 更多资源

- [语雀 API 文档](https://www.yuque.com/yuque/developer/api)
- [OpenAPI 规范](https://app.swaggerhub.com/apis-docs/Jeff-Tian/yuque-open_api/2.0.1)
`,
};

/**
 * Register all Yuque MCP resources
 * @param server - The MCP server instance
 * @param createService - Factory function to create YuqueService instances
 */
export function registerAllResources(server: McpServer, createService: ServiceFactory): void {
  // 注册静态资源：写作指南
  server.registerResource(
    "yuque-writing-guide",
    "yuque://docs/writing-guide",
    {
      title: "语雀写作指南",
      description: "语雀文档写作的最佳实践和格式指南",
      mimeType: "text/markdown",
    },
    async (uri) => {
      Logger.log(`Reading resource: ${uri.toString()}`);
      const content = STATIC_RESOURCES["yuque://docs/writing-guide"];

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );

  // 注册静态资源：Markdown 速查表
  server.registerResource(
    "yuque-markdown-cheatsheet",
    "yuque://docs/markdown-cheatsheet",
    {
      title: "语雀 Markdown 速查表",
      description: "语雀支持的 Markdown 语法速查表",
      mimeType: "text/markdown",
    },
    async (uri) => {
      Logger.log(`Reading resource: ${uri.toString()}`);
      const content = STATIC_RESOURCES["yuque://docs/markdown-cheatsheet"];

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );

  // 注册静态资源：API 快速入门
  server.registerResource(
    "yuque-api-quickstart",
    "yuque://docs/api-quickstart",
    {
      title: "语雀 API 快速入门",
      description: "语雀 API 使用快速入门指南",
      mimeType: "text/markdown",
    },
    async (uri) => {
      Logger.log(`Reading resource: ${uri.toString()}`);
      const content = STATIC_RESOURCES["yuque://docs/api-quickstart"];

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );

  // 注册资源模板：知识库信息
  server.registerResource(
    "yuque-repo-info",
    new ResourceTemplate("yuque://repos/{namespace}", {
      list: undefined,
    }),
    {
      title: "语雀知识库信息",
      description: "获取指定语雀知识库的详细信息",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const namespace = Array.isArray(variables.namespace)
        ? variables.namespace[0]
        : variables.namespace;
      Logger.log(`Reading repo resource: ${namespace}`);

      try {
        const yuqueService = createService();
        const repo = await yuqueService.getRepo(namespace);

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "application/json",
              text: JSON.stringify(repo, null, 2),
            },
          ],
        };
      } catch (error) {
        Logger.error(`Error reading repo ${namespace}:`, error);
        throw new Error(`Failed to read repo: ${error}`);
      }
    }
  );

  // 注册资源模板：文档内容
  server.registerResource(
    "yuque-doc-content",
    new ResourceTemplate("yuque://docs/{namespace}/{slug}", {
      list: undefined,
    }),
    {
      title: "语雀文档内容",
      description: "获取指定语雀文档的完整内容",
      mimeType: "text/markdown",
    },
    async (uri, variables) => {
      const namespace = Array.isArray(variables.namespace)
        ? variables.namespace[0]
        : variables.namespace;
      const slug = Array.isArray(variables.slug) ? variables.slug[0] : variables.slug;
      Logger.log(`Reading doc resource: ${namespace}/${slug}`);

      try {
        const yuqueService = createService();
        const doc = await yuqueService.getDoc(namespace, slug);

        // 提取文档内容
        const docContent = doc.body || doc.body_html || "无内容";

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/markdown",
              text: docContent,
            },
          ],
        };
      } catch (error) {
        Logger.error(`Error reading doc ${namespace}/${slug}:`, error);
        throw new Error(`Failed to read doc: ${error}`);
      }
    }
  );

  // 注册资源模板：知识库目录
  server.registerResource(
    "yuque-repo-toc",
    new ResourceTemplate("yuque://toc/{namespace}", {
      list: undefined,
    }),
    {
      title: "语雀知识库目录",
      description: "获取指定语雀知识库的目录结构",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const namespace = Array.isArray(variables.namespace)
        ? variables.namespace[0]
        : variables.namespace;
      Logger.log(`Reading TOC resource: ${namespace}`);

      try {
        const yuqueService = createService();
        const toc = await yuqueService.getRepoToc(namespace);

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "application/json",
              text: JSON.stringify(toc, null, 2),
            },
          ],
        };
      } catch (error) {
        Logger.error(`Error reading TOC ${namespace}:`, error);
        throw new Error(`Failed to read TOC: ${error}`);
      }
    }
  );
}

/**
 * Display available resources to the console
 */
export function displayAvailableResources(): void {
  console.log("\n======== 语雀 MCP 服务器可用 Resources ========");
  console.log("以下静态 Resources 可用于获取参考信息：");
  console.log("-----------------------------------------------");

  AVAILABLE_RESOURCES.forEach((resource) => {
    console.log(`\n• ${resource.name}`);
    console.log(`  URI：${resource.uri}`);
    console.log(`  标题：${resource.title}`);
    console.log(`  描述：${resource.description}`);
  });

  console.log("\n\n以下 Resource Templates 可用于动态获取语雀数据：");
  console.log("------------------------------------------------");

  AVAILABLE_RESOURCE_TEMPLATES.forEach((template) => {
    console.log(`\n• ${template.name}`);
    console.log(`  URI 模板：${template.uri}`);
    console.log(`  标题：${template.title}`);
    console.log(`  描述：${template.description}`);
  });

  console.log("\n===============================================\n");
}
