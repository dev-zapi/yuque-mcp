import { describe, it, expect, vi, beforeEach } from "vitest";
import { splitDocumentContent, registerDocTools } from "../../src/tools/doc-tools";
import { YuqueDoc } from "../../src/services/types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YuqueService } from "../../src/services/yuque";
import { ServiceFactory } from "../../src/tools/types";

// Mock McpServer
const mockTool = vi.fn();
const mockMcpServer = {
  tool: mockTool,
} as unknown as McpServer;

// Mock YuqueService
const mockGetDoc = vi.fn();
const mockCreateDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

const mockYuqueService = {
  getDoc: mockGetDoc,
  createDoc: mockCreateDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
} as unknown as YuqueService;

const mockCreateService: ServiceFactory = (accessToken) => mockYuqueService;

describe("doc-tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("splitDocumentContent", () => {
    it("should not split small documents", () => {
      const doc = { id: 1, title: "Test Doc", body: "Small content" } as YuqueDoc;
      const chunks = splitDocumentContent(doc, 1000);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(doc); // Should return original object casted
    });

    it("should split large documents", () => {
      // Create a fake large document
      // We know splitDocumentContent uses JSON.stringify(doc) to determine size
      // So we need a doc that stringifies to > chunkSize
      const largeBody = "a".repeat(200);
      const doc = { id: 1, title: "Large Doc", body: largeBody } as YuqueDoc;

      // Let's set a small chunk size to force splitting
      // The JSON string will be roughly {"id":1,"title":"Large Doc","body":"aaaa..."}
      // length approx 200 + overhead. Set chunk size to 100.
      const chunkSize = 100;
      const chunks = splitDocumentContent(doc, chunkSize);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0]._chunk_info).toBeDefined();
      expect(chunks[0]._original_doc_id).toBe(1);
      expect(chunks[0].text_content).toBeDefined();
    });

    it("should handle overlap correctly", () => {
      const doc = { id: 1, title: "Doc", body: "1234567890" } as YuqueDoc;

      const chunks = splitDocumentContent(doc, 20); // Force split
      // Just verify we get multiple chunks
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe("registerDocTools", () => {
    it("should register all document tools", () => {
      registerDocTools(mockMcpServer, mockCreateService);

      expect(mockTool).toHaveBeenCalledTimes(8); // Now we have 8 tools
      expect(mockTool).toHaveBeenCalledWith(
        "get_doc_chunked",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockTool).toHaveBeenCalledWith(
        "get_doc_full",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockTool).toHaveBeenCalledWith(
        "get_doc_chunks_info",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockTool).toHaveBeenCalledWith(
        "create_doc_chunked",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockTool).toHaveBeenCalledWith(
        "create_doc_full",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockTool).toHaveBeenCalledWith(
        "update_doc_chunked",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockTool).toHaveBeenCalledWith(
        "update_doc_full",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockTool).toHaveBeenCalledWith(
        "delete_doc",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    // Helper to extract the handler for a specific tool
    const getHandler = (toolName: string) => {
      const call = mockTool.mock.calls.find((call) => call[0] === toolName);
      return call ? call[3] : undefined;
    };

    describe("get_doc_chunked handler", () => {
      it("should fetch and return document chunked", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("get_doc_chunked");

        const mockDoc = { id: 1, title: "Test Doc", body: "Content" };
        mockGetDoc.mockResolvedValue(mockDoc);

        const result = await handler({ namespace: "user/repo", slug: "doc-slug" });

        expect(mockGetDoc).toHaveBeenCalledWith("user/repo", "doc-slug");
        expect(JSON.parse(result.content[0].text)).toEqual(mockDoc);
      });

      it("should return specific chunk if requested", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("get_doc_chunked");

        // Make a doc that will be split
        const mockDoc = { id: 1, title: "Test Doc", body: "a".repeat(200) };
        mockGetDoc.mockResolvedValue(mockDoc);

        // chunkSize 100 should force split
        const result = await handler({
          namespace: "user/repo",
          slug: "doc-slug",
          chunk_index: 0,
          chunk_size: 100,
        });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed._chunk_info).toBeDefined();
        expect(parsed._chunk_info.index).toBe(0);
      });

      it("should handle errors", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("get_doc_chunked");

        mockGetDoc.mockRejectedValue(new Error("Fetch failed"));

        const result = await handler({ namespace: "user/repo", slug: "doc-slug" });
        expect(result.content[0].text).toContain("Error fetching doc");
      });
    });

    describe("get_doc_full handler", () => {
      it("should fetch and return full document", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("get_doc_full");

        const mockDoc = { id: 1, title: "Test Doc", body: "Full content here" };
        mockGetDoc.mockResolvedValue(mockDoc);

        const result = await handler({ namespace: "user/repo", slug: "doc-slug" });

        expect(mockGetDoc).toHaveBeenCalledWith("user/repo", "doc-slug");
        const parsed = JSON.parse(result.content[0].text);
        // Should return the full document, not a chunk
        expect(parsed.id).toBe(1);
        expect(parsed.body).toBe("Full content here");
        expect(parsed._chunk_info).toBeUndefined(); // Should not have chunk info
      });

      it("should handle errors", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("get_doc_full");

        mockGetDoc.mockRejectedValue(new Error("Fetch failed"));

        const result = await handler({ namespace: "user/repo", slug: "doc-slug" });
        expect(result.content[0].text).toContain("Error fetching full doc");
      });
    });

    describe("create_doc_chunked handler", () => {
      it("should create document chunked", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("create_doc_chunked");

        const mockDoc = { id: 1, title: "New Doc" };
        mockCreateDoc.mockResolvedValue(mockDoc);

        const result = await handler({
          namespace: "user/repo",
          title: "New Doc",
          slug: "new-doc",
          body: "Content",
          format: "markdown",
          public_level: 1,
        });

        expect(mockCreateDoc).toHaveBeenCalledWith(
          "user/repo",
          "New Doc",
          "new-doc",
          "Content",
          "markdown",
          1
        );
        expect(JSON.parse(result.content[0].text)).toEqual(mockDoc);
      });


    });

    describe("create_doc_full handler", () => {
      it("should create full document", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("create_doc_full");

        const mockDoc = { id: 1, title: "New Full Doc" };
        mockCreateDoc.mockResolvedValue(mockDoc);

        const result = await handler({
          namespace: "user/repo",
          title: "New Full Doc",
          slug: "new-full-doc",
          body: "Full Content",
          format: "markdown",
          public_level: 1,
        });

        expect(mockCreateDoc).toHaveBeenCalledWith(
          "user/repo",
          "New Full Doc",
          "new-full-doc",
          "Full Content",
          "markdown",
          1
        );
        expect(JSON.parse(result.content[0].text)).toEqual(mockDoc);
      });
    });

    describe("update_doc_chunked handler", () => {
      it("should update document chunked", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("update_doc_chunked");

        const mockDoc = { id: 1, title: "Updated Doc" };
        mockUpdateDoc.mockResolvedValue(mockDoc);

        const result = await handler({
          namespace: "user/repo",
          id: 1,
          title: "Updated Doc",
        });

        expect(mockUpdateDoc).toHaveBeenCalledWith("user/repo", 1, { title: "Updated Doc" });
        expect(JSON.parse(result.content[0].text)).toEqual(mockDoc);
      });


    });

    describe("update_doc_full handler", () => {
      it("should update full document", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("update_doc_full");

        const mockDoc = { id: 1, title: "Updated Full Doc" };
        mockUpdateDoc.mockResolvedValue(mockDoc);

        const result = await handler({
          namespace: "user/repo",
          id: 1,
          title: "Updated Full Doc",
        });

        expect(mockUpdateDoc).toHaveBeenCalledWith("user/repo", 1, { title: "Updated Full Doc" });
        expect(JSON.parse(result.content[0].text)).toEqual(mockDoc);
      });
    });

    describe("delete_doc handler", () => {
      it("should delete document", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("delete_doc");

        mockDeleteDoc.mockResolvedValue({ id: 1 }); // Some response

        const result = await handler({
          namespace: "user/repo",
          id: 1,
        });

        expect(mockDeleteDoc).toHaveBeenCalledWith("user/repo", 1);
        expect(result.content[0].text).toContain("successfully deleted");
      });
    });

    describe("get_doc_chunks_info handler", () => {
      it("should return chunk info", async () => {
        registerDocTools(mockMcpServer, mockCreateService);
        const handler = getHandler("get_doc_chunks_info");

        // Create a larger document that will be chunked
        const mockDoc = { id: 1, title: "Test Doc", body: "a".repeat(300) }; // Larger content to ensure chunking
        mockGetDoc.mockResolvedValue(mockDoc);

        const result = await handler({ namespace: "user/repo", slug: "doc-slug", chunk_size: 100 });

        const parsed = JSON.parse(result.content[0].text);
        // The result should have the chunk info, whether it's chunked or not
        expect(parsed.document_id).toBe(1);
        expect(parsed.title).toBe("Test Doc");
        expect(parsed.chunk_size).toBe(100);
      });
    });
  });
});