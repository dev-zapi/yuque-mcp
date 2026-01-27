import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YuqueService } from "../services/yuque";

/**
 * Function type for creating YuqueService instance
 */
export type ServiceFactory = (accessToken?: string) => YuqueService;

/**
 * Function type for tool registration
 */
export type ToolRegistrar = (server: McpServer, createService: ServiceFactory) => void;

/**
 * Document chunk information
 */
export interface ChunkInfo {
  index: number;
  total: number;
  is_chunked: boolean;
  chunk_size: number;
  overlap_size: number;
  content_type: string;
  context: {
    has_previous: boolean;
    has_next: boolean;
    note: string;
  };
}

/**
 * Document chunk result
 */
export interface DocChunk {
  _original_doc_id: number;
  _original_title: string;
  _chunk_info: ChunkInfo;
  text_content: string;
  title: string;
  parse_error?: string;
  [key: string]: unknown;
}

/**
 * MCP Tool content response
 * Uses index signature to be compatible with MCP SDK's CallToolResult type
 */
export interface ToolResponse {
  content: Array<{ type: "text"; text: string }>;
  [key: string]: unknown;
}
