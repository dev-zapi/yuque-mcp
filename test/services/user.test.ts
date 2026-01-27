import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../../src/services/yuque/user";
import { AxiosInstance } from "axios";

describe("UserService", () => {
  let userService: UserService;
  let mockClient: AxiosInstance;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosInstance;
    userService = new UserService(mockClient);
  });

  it("should get current user", async () => {
    const mockUser = { id: 1, name: "Test User", login: "testuser" };
    (mockClient.get as any).mockResolvedValue({ data: { data: mockUser } });

    const result = await userService.getCurrentUser();

    expect(mockClient.get).toHaveBeenCalledWith("/user");
    expect(result).toEqual(mockUser);
  });

  it("should get user docs", async () => {
    const mockDocs = [{ id: 1, title: "Test Doc", slug: "test-doc" }];
    (mockClient.get as any).mockResolvedValue({ data: { data: mockDocs } });

    const result = await userService.getUserDocs();

    expect(mockClient.get).toHaveBeenCalledWith("/user/docs");
    expect(result).toEqual(mockDocs);
  });

  it("should get user groups with params", async () => {
    const mockGroups = [{ id: 1, name: "Test Group", login: "testgroup" }];
    (mockClient.get as any).mockResolvedValue({ data: { data: mockGroups } });

    const result = await userService.getUserGroups("123", 1, 10);

    expect(mockClient.get).toHaveBeenCalledWith("/users/123/groups", {
      params: { role: 1, offset: 10 },
    });
    expect(result).toEqual(mockGroups);
  });
});
