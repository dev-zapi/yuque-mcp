import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSearchTools } from "../../src/tools/search-tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YuqueService } from "../../src/services/yuque";
import { ServiceFactory } from "../../src/tools/types";

// Mock McpServer
const mockTool = vi.fn();
const mockMcpServer = {
  tool: mockTool,
} as unknown as McpServer;

// Mock YuqueService
const mockSearch = vi.fn();

const mockYuqueService = {
  search: mockSearch,
} as unknown as YuqueService;

const mockCreateService: ServiceFactory = (accessToken) => mockYuqueService;

describe("search-tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register all search tools", () => {
    registerSearchTools(mockMcpServer, mockCreateService);

    expect(mockTool).toHaveBeenCalledTimes(1);
    expect(mockTool).toHaveBeenCalledWith(
      "search",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  const getHandler = (toolName: string) => {
    const call = mockTool.mock.calls.find((call) => call[0] === toolName);
    return call ? call[3] : undefined;
  };

  describe("search handler", () => {
    it("should return search results", async () => {
      registerSearchTools(mockMcpServer, mockCreateService);
      const handler = getHandler("search");

      const mockResults = [{ id: 1, title: "Result 1" }];
      mockSearch.mockResolvedValue(mockResults);

      const result = await handler({ query: "test", type: "doc" });

      expect(mockSearch).toHaveBeenCalledWith("test", "doc", undefined, undefined, undefined);
      expect(JSON.parse(result.content[0].text)).toEqual(mockResults);
    });

    it("should handle optional params", async () => {
      registerSearchTools(mockMcpServer, mockCreateService);
      const handler = getHandler("search");

      const mockResults = [];
      mockSearch.mockResolvedValue(mockResults);

      await handler({ query: "test", type: "doc", scope: "scope", page: 2, creator: "me" });

      expect(mockSearch).toHaveBeenCalledWith("test", "doc", "scope", 2, "me");
    });

    it("should handle errors", async () => {
      registerSearchTools(mockMcpServer, mockCreateService);
      const handler = getHandler("search");

      mockSearch.mockRejectedValue(new Error("Search failed"));

      const result = await handler({ query: "test", type: "doc" });
      expect(result.content[0].text).toContain("Error searching");
    });
  });
});
