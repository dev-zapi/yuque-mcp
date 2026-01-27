import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../../src/services/yuque/document";
import { AxiosInstance } from "axios";

describe("DocumentService", () => {
  let documentService: DocumentService;
  let mockClient: AxiosInstance;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosInstance;
    documentService = new DocumentService(mockClient);
  });

  it("should get repo docs with params", async () => {
    const mockDocs = [{ id: 1, title: "Test Doc", slug: "test-doc" }];
    (mockClient.get as any).mockResolvedValue({ data: { data: mockDocs } });

    const result = await documentService.getRepoDocs("user/repo", 0, 10, "hit");

    expect(mockClient.get).toHaveBeenCalledWith("/repos/user/repo/docs", {
      params: { offset: 0, limit: 10, optional_properties: "hit" },
    });
    expect(result).toEqual(mockDocs);
  });

  it("should get doc and filter out unnecessary fields", async () => {
    const mockDoc = {
      id: 1,
      title: "Test Doc",
      slug: "test-doc",
      body: "markdown content",
      body_lake: "lake content",
      body_draft: "draft content",
      body_html: "html content",
    };
    (mockClient.get as any).mockResolvedValue({ data: { data: mockDoc } });

    const result = await documentService.getDoc("user/repo", "test-doc");

    expect(mockClient.get).toHaveBeenCalledWith("/repos/user/repo/docs/test-doc", {
      params: {},
    });
    expect(result).toEqual({
      id: 1,
      title: "Test Doc",
      slug: "test-doc",
      body: "markdown content",
    });
    expect(result).not.toHaveProperty("body_lake");
    expect(result).not.toHaveProperty("body_draft");
    expect(result).not.toHaveProperty("body_html");
  });

  it("should create doc", async () => {
    const mockDoc = { id: 1, title: "New Doc", slug: "new-doc" };
    (mockClient.post as any).mockResolvedValue({ data: { data: mockDoc } });

    const result = await documentService.createDoc(
      "user/repo",
      "New Doc",
      "new-doc",
      "content",
      "markdown",
      1
    );

    expect(mockClient.post).toHaveBeenCalledWith("/repos/user/repo/docs", {
      title: "New Doc",
      slug: "new-doc",
      body: "content",
      format: "markdown",
      public: 1,
    });
    expect(result).toEqual(mockDoc);
  });

  it("should update doc", async () => {
    const mockDoc = { id: 1, title: "Updated Doc" };
    (mockClient.put as any).mockResolvedValue({ data: { data: mockDoc } });

    const result = await documentService.updateDoc("user/repo", 123, {
      title: "Updated Doc",
      body: "new content",
    });

    expect(mockClient.put).toHaveBeenCalledWith("/repos/user/repo/docs/123", {
      title: "Updated Doc",
      body: "new content",
    });
    expect(result).toEqual(mockDoc);
  });

  it("should delete doc", async () => {
    const mockDoc = { id: 1, title: "Deleted Doc" };
    (mockClient.delete as any).mockResolvedValue({ data: { data: mockDoc } });

    const result = await documentService.deleteDoc("user/repo", 123);

    expect(mockClient.delete).toHaveBeenCalledWith("/repos/user/repo/docs/123");
    expect(result).toEqual(mockDoc);
  });
});
