import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUserTools } from "../../src/tools/user-tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YuqueService } from "../../src/services/yuque";
import { ServiceFactory } from "../../src/tools/types";

// Mock McpServer
const mockTool = vi.fn();
const mockMcpServer = {
  tool: mockTool,
} as unknown as McpServer;

// Mock YuqueService
const mockGetCurrentUser = vi.fn();
const mockGetUserDocs = vi.fn();

const mockYuqueService = {
  getCurrentUser: mockGetCurrentUser,
  getUserDocs: mockGetUserDocs,
} as unknown as YuqueService;

const mockCreateService: ServiceFactory = (accessToken) => mockYuqueService;

describe("user-tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register all user tools", () => {
    registerUserTools(mockMcpServer, mockCreateService);

    expect(mockTool).toHaveBeenCalledTimes(2);
    expect(mockTool).toHaveBeenCalledWith(
      "get_current_user",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
    expect(mockTool).toHaveBeenCalledWith(
      "get_user_docs",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  const getHandler = (toolName: string) => {
    const call = mockTool.mock.calls.find((call) => call[0] === toolName);
    return call ? call[3] : undefined;
  };

  describe("get_current_user handler", () => {
    it("should return current user", async () => {
      registerUserTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_current_user");

      const mockUser = { id: 1, name: "Test User" };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await handler({});

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(JSON.parse(result.content[0].text)).toEqual(mockUser);
    });

    it("should handle errors", async () => {
      registerUserTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_current_user");

      mockGetCurrentUser.mockRejectedValue(new Error("Auth failed"));

      const result = await handler({});
      expect(result.content[0].text).toContain("Error fetching current user");
    });
  });

  describe("get_user_docs handler", () => {
    it("should return user docs", async () => {
      registerUserTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_user_docs");

      const mockDocs = [{ id: 1, title: "Doc 1" }];
      mockGetUserDocs.mockResolvedValue(mockDocs);

      const result = await handler({});

      expect(mockGetUserDocs).toHaveBeenCalled();
      expect(JSON.parse(result.content[0].text)).toEqual(mockDocs);
    });
  });
});
