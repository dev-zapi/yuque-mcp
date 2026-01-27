import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRepoTools } from "../../src/tools/repo-tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YuqueService } from "../../src/services/yuque";
import { ServiceFactory } from "../../src/tools/types";

// Mock McpServer
const mockTool = vi.fn();
const mockMcpServer = {
  tool: mockTool,
} as unknown as McpServer;

// Mock YuqueService
const mockGetUserRepos = vi.fn();
const mockGetRepoDocs = vi.fn();

const mockYuqueService = {
  getUserRepos: mockGetUserRepos,
  getRepoDocs: mockGetRepoDocs,
} as unknown as YuqueService;

const mockCreateService: ServiceFactory = (accessToken) => mockYuqueService;

describe("repo-tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register all repo tools", () => {
    registerRepoTools(mockMcpServer, mockCreateService);

    expect(mockTool).toHaveBeenCalledTimes(2);
    expect(mockTool).toHaveBeenCalledWith(
      "get_user_repos",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
    expect(mockTool).toHaveBeenCalledWith(
      "get_repo_docs",
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });

  const getHandler = (toolName: string) => {
    const call = mockTool.mock.calls.find((call) => call[0] === toolName);
    return call ? call[3] : undefined;
  };

  describe("get_user_repos handler", () => {
    it("should return user repos", async () => {
      registerRepoTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_user_repos");

      const mockRepos = [{ id: 1, name: "Repo 1" }];
      mockGetUserRepos.mockResolvedValue(mockRepos);

      const result = await handler({ login: "testuser" });

      expect(mockGetUserRepos).toHaveBeenCalledWith("testuser");
      expect(JSON.parse(result.content[0].text)).toEqual(mockRepos);
    });

    it("should handle errors", async () => {
      registerRepoTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_user_repos");

      mockGetUserRepos.mockRejectedValue(new Error("Fetch failed"));

      const result = await handler({ login: "testuser" });
      expect(result.content[0].text).toContain("Error fetching repos");
    });
  });

  describe("get_repo_docs handler", () => {
    it("should return repo docs", async () => {
      registerRepoTools(mockMcpServer, mockCreateService);
      const handler = getHandler("get_repo_docs");

      const mockDocs = [{ id: 1, title: "Doc 1" }];
      mockGetRepoDocs.mockResolvedValue(mockDocs);

      const result = await handler({ namespace: "user/repo" });

      expect(mockGetRepoDocs).toHaveBeenCalledWith("user/repo");
      expect(JSON.parse(result.content[0].text)).toEqual(mockDocs);
    });
  });
});
