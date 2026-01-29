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
    "获取语雀中特定文档的详细内容，支持分块处理大型文档",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      slug: z.string().describe("文档的唯一标识或短链接名称"),
      chunk_index: z
        .number()
        .optional()
        .describe("要获取的文档块索引，不提供则返回第一块或全部（如果内容较小）"),
      chunk_size: z.number().optional().describe("分块大小（字符数），默认为100000"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
    "获取语雀中特定文档的完整内容，不进行分块处理",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      slug: z.string().describe("文档的唯一标识或短链接名称"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
    },
    async ({
      namespace,
      slug,
      accessToken,
    }): Promise<ToolResponse> => {
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
    "获取文档的分块元信息，包括总块数、每块的字符数等",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      slug: z.string().describe("文档的唯一标识或短链接名称"),
      chunk_size: z.number().optional().describe("分块大小（字符数），默认为100000"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
    "在指定知识库中创建新的语雀文档，支持多种格式内容（支持大型文档分块处理）",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      title: z.string().describe("文档标题"),
      slug: z.string().describe("文档的短链接名称，用于URL路径"),
      body: z.string().describe("文档内容，支持Markdown格式"),
      format: z
        .string()
        .optional()
        .describe("内容格式，可选值：markdown、html、lake，默认为 markdown"),
      public_level: z
        .number()
        .optional()
        .describe("公开性，可选值：0(私密)、1(公开)、2(企业内公开)，默认为 1"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
    "在指定知识库中创建新的语雀文档，完整内容版本，不进行分块处理",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      title: z.string().describe("文档标题"),
      slug: z.string().describe("文档的短链接名称，用于URL路径"),
      body: z.string().describe("文档内容，支持Markdown格式"),
      format: z
        .string()
        .optional()
        .describe("内容格式，可选值：markdown、html、lake，默认为 markdown"),
      public_level: z
        .number()
        .optional()
        .describe("公开性，可选值：0(私密)、1(公开)、2(企业内公开)，默认为 1"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
    "更新语雀中已存在的文档，支持分块处理大型文档",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      id: z.number().describe("要更新的文档ID"),
      title: z.string().optional().describe("文档的新标题"),
      slug: z.string().optional().describe("文档的新短链接名称"),
      body: z.string().optional().describe("文档的新内容，支持Markdown格式"),
      public: z.number().optional().describe("文档的公开状态，0(私密)、1(公开)、2(企业内公开)"),
      format: z.string().optional().describe("内容格式，可选值：markdown、html、lake"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
    "更新语雀中已存在的文档，完整内容版本，不进行分块处理",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      id: z.number().describe("要更新的文档ID"),
      title: z.string().optional().describe("文档的新标题"),
      slug: z.string().optional().describe("文档的新短链接名称"),
      body: z.string().optional().describe("文档的新内容，支持Markdown格式"),
      public: z.number().optional().describe("文档的公开状态，0(私密)、1(公开)、2(企业内公开)"),
      format: z.string().optional().describe("内容格式，可选值：markdown、html、lake"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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
    "从语雀知识库中删除指定文档，此操作不可撤销",
    {
      namespace: z.string().describe("知识库的命名空间，格式为 user/repo"),
      id: z.number().describe("要删除的文档ID"),
      accessToken: z.string().optional().describe("用于认证 API 请求的令牌"),
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