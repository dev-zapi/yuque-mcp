import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ServiceFactory, ToolResponse, DocChunk, ChunkInfo } from "./types";
import { Logger } from "../server";
import { YuqueDoc } from "../services/types";

/**
 * Split large document content into smaller chunks
 */
export function splitDocumentContent(doc: YuqueDoc, chunkSize: number = 100000): DocChunk[] {
  // Convert full document object to formatted JSON string
  const fullDocString = JSON.stringify(doc, null, 2);
  console.log("fullDocString length: " + fullDocString.length);

  // If the document string is smaller than chunk size, return as is
  if (fullDocString.length <= chunkSize) {
    return [doc as unknown as DocChunk];
  }

  // Use simple text splitting logic with overlap
  const overlapSize = 200;
  const chunks: string[] = [];

  // Split by fixed size without considering content boundaries
  let startIndex = 0;
  // Safety break to prevent infinite loops
  let loopCount = 0;
  const maxLoops = 10000;

  while (startIndex < fullDocString.length) {
    if (loopCount++ > maxLoops) {
      Logger.error(
        `Infinite loop detected in splitDocumentContent. string length: ${fullDocString.length}, chunk size: ${chunkSize}`
      );
      break;
    }

    const endIndex = Math.min(startIndex + chunkSize, fullDocString.length);
    chunks.push(fullDocString.substring(startIndex, endIndex));
    startIndex = endIndex - overlapSize;

    // Fix for infinite loop when chunkSize <= overlapSize
    if (chunkSize <= overlapSize) {
      // If chunk size is smaller than or equal to overlap, we can't make progress with overlap
      // Just move forward by chunkSize to avoid infinite loop
      startIndex = endIndex;
    }

    if (startIndex >= fullDocString.length) {
      break;
    }
  }

  // Create document object for each chunk with metadata
  return chunks.map((chunk, index) => {
    const chunkInfo: ChunkInfo = {
      index: index,
      total: chunks.length,
      is_chunked: true,
      chunk_size: chunkSize,
      overlap_size: overlapSize,
      content_type: "full_doc_json",
      context: {
        has_previous: index > 0,
        has_next: index < chunks.length - 1,
        note: index > 0 ? "此内容包含与前一块重叠的部分" : "",
      },
    };

    const result: DocChunk = {
      _original_doc_id: doc.id,
      _original_title: doc.title,
      _chunk_info: chunkInfo,
      text_content: chunk,
      title: `${doc.title} [部分 ${index + 1}/${chunks.length}]`,
    };

    // Try to parse text chunk back to JSON if it's a complete JSON object
    try {
      if (chunk.trim().startsWith("{") && chunk.trim().endsWith("}")) {
        const parsedChunk = JSON.parse(chunk);
        Object.assign(result, parsedChunk);
      }
    } catch {
      result.parse_error = "块内容不是完整的JSON对象，保留为文本";
    }

    return result;
  });
}

/**
 * Register document-related tools
 */
export function registerDocTools(server: McpServer, createService: ServiceFactory): void {
  // Tool to get a specific document with chunking support
  server.tool(
    "get_doc_chunked",
    "获取语雀文档内容（分块版本）。适用于大型文档，可将内容分块获取以避免响应过大。先使用 get_doc_chunks_info 查看文档分块信息，再按需获取特定块。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      slug: z
        .string()
        .describe("文档的唯一标识（短链接名称），通常是文档URL的最后一部分。例如：getting-started"),
      chunk_index: z
        .number()
        .optional()
        .describe("要获取的块索引（从0开始）。不指定则返回第一块，或当文档较小时返回完整内容"),
      chunk_size: z
        .number()
        .optional()
        .describe("分块大小（字符数），默认100000。仅在首次获取时生效，后续应使用相同的分块大小"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({
      namespace,
      slug,
      chunk_index,
      chunk_size = 100000,
      accessToken,
    }): Promise<ToolResponse> => {
      try {
        Logger.log(`Fetching document ${slug} from repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const doc = await yuqueService.getDoc(namespace, slug);

        Logger.log(
          `Successfully fetched document: ${doc.title}, content length: ${doc.body?.length || 0} chars`
        );

        const docChunks = splitDocumentContent(doc, chunk_size);

        if (docChunks.length > 1) {
          Logger.log(`Document has been split into ${docChunks.length} chunks`);

          if (chunk_index === undefined) {
            const firstChunk = docChunks[0];
            Logger.log(`Returning first chunk (1/${docChunks.length})`);
            return {
              content: [{ type: "text", text: JSON.stringify(firstChunk, null, 2) }],
            };
          }

          if (chunk_index < 0 || chunk_index >= docChunks.length) {
            const error = `Invalid chunk_index: ${chunk_index}. Valid range is 0-${docChunks.length - 1}`;
            Logger.error(error);
            return {
              content: [{ type: "text", text: error }],
            };
          }

          Logger.log(`Returning chunk ${chunk_index + 1}/${docChunks.length}`);
          return {
            content: [{ type: "text", text: JSON.stringify(docChunks[chunk_index], null, 2) }],
          };
        } else {
          Logger.log(`Document is small enough, no chunking needed`);
          return {
            content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
          };
        }
      } catch (error) {
        Logger.error(`Error fetching doc ${slug} from repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching doc: ${error}` }],
        };
      }
    }
  );

  // Tool to get a full document without chunking
  server.tool(
    "get_doc_full",
    "获取语雀文档完整内容（不分块）。适合内容较小的文档一次性获取。如果文档很大可能导致响应超时，此时请使用 get_doc_chunked 分块获取。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      slug: z
        .string()
        .describe("文档的唯一标识（短链接名称），通常是文档URL的最后一部分。例如：getting-started"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({ namespace, slug, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Fetching full document ${slug} from repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const doc = await yuqueService.getDoc(namespace, slug);

        Logger.log(
          `Successfully fetched full document: ${doc.title}, content length: ${doc.body?.length || 0} chars`
        );

        return {
          content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching full doc ${slug} from repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching full doc: ${error}` }],
        };
      }
    }
  );

  // Tool to get document chunks info
  server.tool(
    "get_doc_chunks_info",
    "获取语雀文档的分块信息。在使用 get_doc_chunked 获取大型文档前，先用此工具查看文档总大小、分块数量及每块范围，便于规划分块获取策略。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      slug: z
        .string()
        .describe("文档的唯一标识（短链接名称），通常是文档URL的最后一部分。例如：getting-started"),
      chunk_size: z
        .number()
        .optional()
        .describe("计划使用的分块大小（字符数），默认100000。返回的分块信息将基于此大小计算"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({ namespace, slug, chunk_size = 100000, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Fetching document chunk info for ${slug} from repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const doc = await yuqueService.getDoc(namespace, slug);

        const fullDocString = JSON.stringify(doc, null, 2);
        const overlapSize = 200;
        let totalChunks = 1;

        if (fullDocString.length > chunk_size) {
          totalChunks = Math.ceil(
            (fullDocString.length - overlapSize) / (chunk_size - overlapSize)
          );
        } else {
          // Correct logic: if doc size <= chunk size, it is 1 chunk (not 0)
          totalChunks = 1;
        }

        const chunksInfo = {
          document_id: doc.id,
          title: doc.title,
          total_chunks: totalChunks,
          total_length: fullDocString.length,
          chunk_size: chunk_size,
          overlap_size: overlapSize,
          estimated_chunks: Array.from({ length: totalChunks }, (_, index) => {
            const startPosition = index === 0 ? 0 : index * (chunk_size - overlapSize);
            const endPosition = Math.min(startPosition + chunk_size, fullDocString.length);

            return {
              index: index,
              title: `${doc.title} [部分 ${index + 1}/${totalChunks}]`,
              approximate_start: startPosition,
              approximate_end: endPosition,
              approximate_length: endPosition - startPosition,
              how_to_get: `使用 get_doc_chunked 工具，指定 chunk_index=${index}`,
            };
          }),
        };

        if (totalChunks === 0) {
          chunksInfo.estimated_chunks = [];
          chunksInfo.total_chunks = 0;
        } else if (totalChunks === 1 && fullDocString.length <= chunk_size) {
          // Case where document is smaller than chunk_size
          chunksInfo.estimated_chunks = [
            {
              index: 0,
              title: `${doc.title} [Full Document]`,
              approximate_start: 0,
              approximate_end: fullDocString.length,
              approximate_length: fullDocString.length,
              how_to_get: `使用 get_doc_chunked 或 get_doc_full 工具`,
            },
          ];
        }

        Logger.log(`Document would be split into ${totalChunks} chunks with size ${chunk_size}`);
        return {
          content: [{ type: "text", text: JSON.stringify(chunksInfo, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error fetching doc chunks info for ${slug} from repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error fetching doc chunks info: ${error}` }],
        };
      }
    }
  );

  // Tool to create a new document (chunked version with option for full document)
  server.tool(
    "create_doc_chunked",
    "在语雀知识库中创建新文档（分块处理版本）。用于创建内容可能较大的文档。创建成功后返回文档元数据。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      title: z.string().describe("文档标题，将显示在文档列表和页面顶部"),
      slug: z
        .string()
        .describe(
          "文档短链接名称，用于构建URL。只能包含字母、数字、连字符和下划线。例如：getting-started"
        ),
      body: z
        .string()
        .describe("文档正文内容，支持 Markdown 格式。可包含标题、列表、代码块、表格等"),
      format: z
        .string()
        .optional()
        .describe("内容格式，可选：markdown（默认）、html、lake。markdown 最常用"),
      public_level: z
        .number()
        .optional()
        .describe(
          "文档可见性：0=私密（仅自己可见），1=公开（所有人可见，默认），2=企业内公开（仅企业成员可见）"
        ),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({
      namespace,
      title,
      slug,
      body,
      format = "markdown",
      public_level = 1,
      accessToken,
    }): Promise<ToolResponse> => {
      try {
        Logger.log(`Creating document "${title}" in repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const doc = await yuqueService.createDoc(
          namespace,
          title,
          slug,
          body,
          format,
          public_level
        );

        Logger.log(`Successfully created document: ${doc.title}`);
        return {
          content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error creating doc in repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error creating doc: ${error}` }],
        };
      }
    }
  );

  // Tool to create a new document (full version)
  server.tool(
    "create_doc_full",
    "在语雀知识库中创建新文档（完整版本）。适合创建内容较小的文档。内容较大时建议使用 create_doc_chunked。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      title: z.string().describe("文档标题，将显示在文档列表和页面顶部"),
      slug: z
        .string()
        .describe(
          "文档短链接名称，用于构建URL。只能包含字母、数字、连字符和下划线。例如：getting-started"
        ),
      body: z
        .string()
        .describe("文档正文内容，支持 Markdown 格式。可包含标题、列表、代码块、表格等"),
      format: z
        .string()
        .optional()
        .describe("内容格式，可选：markdown（默认）、html、lake。markdown 最常用"),
      public_level: z
        .number()
        .optional()
        .describe(
          "文档可见性：0=私密（仅自己可见），1=公开（所有人可见，默认），2=企业内公开（仅企业成员可见）"
        ),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({
      namespace,
      title,
      slug,
      body,
      format = "markdown",
      public_level = 1,
      accessToken,
    }): Promise<ToolResponse> => {
      try {
        Logger.log(`Creating full document "${title}" in repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const doc = await yuqueService.createDoc(
          namespace,
          title,
          slug,
          body,
          format,
          public_level
        );

        Logger.log(`Successfully created full document: ${doc.title}`);
        return {
          content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error creating full doc in repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error creating full doc: ${error}` }],
        };
      }
    }
  );

  // Tool to update a document (chunked version)
  server.tool(
    "update_doc_chunked",
    "更新语雀已有文档（分块版本）。可更新标题、内容、可见性等。只需传入需要修改的字段，未传入的字段保持不变。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      id: z.number().describe("要更新的文档ID。可通过 get_repo_docs 获取文档列表查看ID"),
      title: z.string().optional().describe("新文档标题。不传则保持原标题不变"),
      slug: z.string().optional().describe("新短链接名称。修改后文档URL将改变，原URL会失效"),
      body: z.string().optional().describe("新文档内容，支持 Markdown 格式。不传则保持原内容不变"),
      public: z
        .number()
        .optional()
        .describe("新可见性：0=私密，1=公开，2=企业内公开。不传则保持不变"),
      format: z
        .string()
        .optional()
        .describe("内容格式，可选：markdown、html、lake。不传则保持原格式"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({
      namespace,
      id,
      title,
      slug,
      body,
      public: publicLevel,
      format,
      accessToken,
    }): Promise<ToolResponse> => {
      try {
        Logger.log(`Updating document ${id} in repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const updateData: {
          title?: string;
          slug?: string;
          body?: string;
          public?: number;
          format?: string;
        } = {};
        if (title !== undefined) updateData.title = title;
        if (slug !== undefined) updateData.slug = slug;
        if (body !== undefined) updateData.body = body;
        if (publicLevel !== undefined) updateData.public = publicLevel;
        if (format !== undefined) updateData.format = format;

        const doc = await yuqueService.updateDoc(namespace, id, updateData);

        Logger.log(`Successfully updated document: ${doc.title}`);
        return {
          content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error updating doc ${id} in repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error updating doc: ${error}` }],
        };
      }
    }
  );

  // Tool to update a document (full version)
  server.tool(
    "update_doc_full",
    "更新语雀已有文档（完整版本）。适合更新内容较小的文档。可更新标题、内容、可见性等，只需传入需要修改的字段。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      id: z.number().describe("要更新的文档ID。可通过 get_repo_docs 获取文档列表查看ID"),
      title: z.string().optional().describe("新文档标题。不传则保持原标题不变"),
      slug: z.string().optional().describe("新短链接名称。修改后文档URL将改变，原URL会失效"),
      body: z.string().optional().describe("新文档内容，支持 Markdown 格式。不传则保持原内容不变"),
      public: z
        .number()
        .optional()
        .describe("新可见性：0=私密，1=公开，2=企业内公开。不传则保持不变"),
      format: z
        .string()
        .optional()
        .describe("内容格式，可选：markdown、html、lake。不传则保持原格式"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({
      namespace,
      id,
      title,
      slug,
      body,
      public: publicLevel,
      format,
      accessToken,
    }): Promise<ToolResponse> => {
      try {
        Logger.log(`Updating full document ${id} in repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        const updateData: {
          title?: string;
          slug?: string;
          body?: string;
          public?: number;
          format?: string;
        } = {};
        if (title !== undefined) updateData.title = title;
        if (slug !== undefined) updateData.slug = slug;
        if (body !== undefined) updateData.body = body;
        if (publicLevel !== undefined) updateData.public = publicLevel;
        if (format !== undefined) updateData.format = format;

        const doc = await yuqueService.updateDoc(namespace, id, updateData);

        Logger.log(`Successfully updated full document: ${doc.title}`);
        return {
          content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
        };
      } catch (error) {
        Logger.error(`Error updating full doc ${id} in repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error updating full doc: ${error}` }],
        };
      }
    }
  );

  // Tool to delete a document
  server.tool(
    "delete_doc",
    "从语雀知识库中永久删除指定文档。警告：此操作不可撤销，删除后文档无法恢复。请确认文档ID正确后再执行。",
    {
      namespace: z
        .string()
        .describe("知识库命名空间，格式：user/repo 或 group/repo。例如：john/my-notes"),
      id: z.number().describe("要删除的文档ID。可通过 get_repo_docs 获取文档列表查看ID"),
      accessToken: z
        .string()
        .optional()
        .describe("语雀 API 访问令牌。如不传，则使用环境变量配置的令牌"),
    },
    async ({ namespace, id, accessToken }): Promise<ToolResponse> => {
      try {
        Logger.log(`Deleting document ${id} from repository: ${namespace}`);
        const yuqueService = createService(accessToken);
        await yuqueService.deleteDoc(namespace, id);

        Logger.log(`Successfully deleted document ${id}`);
        return {
          content: [{ type: "text", text: `Document ${id} has been successfully deleted` }],
        };
      } catch (error) {
        Logger.error(`Error deleting doc ${id} from repo ${namespace}:`, error);
        return {
          content: [{ type: "text", text: `Error deleting doc: ${error}` }],
        };
      }
    }
  );
}
