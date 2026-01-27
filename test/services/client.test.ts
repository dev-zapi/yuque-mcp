import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAxiosInstance, YuqueApiError } from "../../src/services/yuque/client";
import axios from "axios";

vi.mock("axios");

describe("YuqueClient", () => {
  const mockCreate = axios.create as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create client with correct headers", () => {
    const apiToken = "test-token";
    const baseURL = "https://test.yuque.com/api/v2";

    const mockInstance = {
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };
    mockCreate.mockReturnValue(mockInstance);

    createAxiosInstance(apiToken, baseURL);

    expect(mockCreate).toHaveBeenCalledWith({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": apiToken,
      },
      timeout: 30000,
    });
  });

  it("should setup error interceptor", () => {
    const mockUse = vi.fn();
    const mockInstance = {
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: mockUse,
        },
      },
    };
    mockCreate.mockReturnValue(mockInstance);

    createAxiosInstance();

    expect(mockUse).toHaveBeenCalled();
  });
});
