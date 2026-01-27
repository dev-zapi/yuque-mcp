import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerStatsTools } from "../../src/tools/stats-tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YuqueService } from "../../src/services/yuque";
import { ServiceFactory } from "../../src/tools/types";

// Mock McpServer
const mockTool = vi.fn();
const mockMcpServer = {
  tool: mockTool,
} as unknown as McpServer;

// Mock YuqueService
const mockGetGroupStatistics = vi.fn();
const mockGetGroupMemberStatistics = vi.fn();
const mockGetGroupBookStatistics = vi.fn();
const mockGetGroupDocStatistics = vi.fn();

const mockYuqueService = {
  getGroupStatistics: mockGetGroupStatistics,
  getGroupMemberStatistics: mockGetGroupMemberStatistics,
  getGroupBookStatistics: mockGetGroupBookStatistics,
  getGroupDocStatistics: mockGetGroupDocStatistics,
} as unknown as YuqueService;

const mockCreateService: ServiceFactory = (accessToken) => mockYuqueService;

describe("stats-tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register all stats tools", () => {
    registerStatsTools(mockMcpServer, mockCreateService);

    expect(mockTool).toHaveBeenCalledTimes(4);
    expect(mockTool).toHaveBeenCalledWith(
      "get_group_statistics",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
    expect(mockTool).toHaveBeenCalledWith(
      "get_group_member_statistics",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
    expect(mockTool).toHaveBeenCalledWith(
      "get_group_book_statistics",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
    expect(mockTool).toHaveBeenCalledWith(
      "get_group_doc_statistics",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  const getHandler = (toolName: string) => {
    const call = mockTool.mock.calls.find((call) => call[0] === toolName);
    return call ? call[3] : undefined;
  };

  describe("get_group_statistics handler", () => {
    it("should return group statistics", async () => {
      registerStatsTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_group_statistics");

      const mockStats = { id: 1, stats: {} };
      mockGetGroupStatistics.mockResolvedValue(mockStats);

      const result = await handler({ login: "group" });

      expect(mockGetGroupStatistics).toHaveBeenCalledWith("group");
      expect(JSON.parse(result.content[0].text)).toEqual(mockStats);
    });
  });

  describe("get_group_member_statistics handler", () => {
    it("should return member statistics", async () => {
      registerStatsTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_group_member_statistics");

      const mockStats = [{ member_id: 1 }];
      mockGetGroupMemberStatistics.mockResolvedValue(mockStats);

      const result = await handler({ login: "group", range: 30 });

      expect(mockGetGroupMemberStatistics).toHaveBeenCalledWith("group", { range: 30 });
      expect(JSON.parse(result.content[0].text)).toEqual(mockStats);
    });
  });

  describe("get_group_book_statistics handler", () => {
    it("should return book statistics", async () => {
      registerStatsTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_group_book_statistics");

      const mockStats = [{ book_id: 1 }];
      mockGetGroupBookStatistics.mockResolvedValue(mockStats);

      const result = await handler({ login: "group", sortField: "read_count" });

      expect(mockGetGroupBookStatistics).toHaveBeenCalledWith("group", { sortField: "read_count" });
      expect(JSON.parse(result.content[0].text)).toEqual(mockStats);
    });
  });

  describe("get_group_doc_statistics handler", () => {
    it("should return doc statistics", async () => {
      registerStatsTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_group_doc_statistics");

      const mockStats = [{ doc_id: 1 }];
      mockGetGroupDocStatistics.mockResolvedValue(mockStats);

      const result = await handler({ login: "group", page: 1 });

      expect(mockGetGroupDocStatistics).toHaveBeenCalledWith("group", { page: 1 });
      expect(JSON.parse(result.content[0].text)).toEqual(mockStats);
    });

    it("should handle errors", async () => {
      registerStatsTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_group_doc_statistics");

      mockGetGroupDocStatistics.mockRejectedValue(new Error("Stats failed"));

      const result = await handler({ login: "group" });
      expect(result.content[0].text).toContain("Error fetching group doc statistics");
    });
  });
});
