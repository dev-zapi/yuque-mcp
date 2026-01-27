import axios, { AxiosInstance, AxiosError } from "axios";
import axiosRetry from "axios-retry";

/**
 * Custom error class for Yuque API errors
 */
export class YuqueApiError extends Error {
  public readonly statusCode: number;
  public readonly originalError?: Error;

  constructor(message: string, statusCode: number, originalError?: Error) {
    super(message);
    this.name = "YuqueApiError";
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Error messages for common HTTP status codes (in Chinese)
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: "请求参数错误：请检查请求参数是否正确",
  401: "认证失败：请检查 API Token 是否有效",
  403: "权限不足：无权访问该资源",
  404: "资源不存在：请检查 namespace 或 slug 是否正确",
  429: "请求过于频繁：请稍后重试",
  500: "服务器错误：语雀服务暂时不可用",
  502: "网关错误：语雀服务暂时不可用",
  503: "服务不可用：语雀服务正在维护中",
  504: "网关超时：请求超时，请稍后重试",
};

/**
 * Setup response interceptor for error handling
 */
function setupErrorInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle timeout errors
      if (error.code === "ECONNABORTED") {
        throw new YuqueApiError("请求超时：请检查网络连接后重试", 0, error);
      }

      // Handle network errors
      if (!error.response) {
        throw new YuqueApiError("网络错误：无法连接到语雀服务器，请检查网络连接", 0, error);
      }

      const status = error.response.status;
      const responseData = error.response.data as { message?: string } | undefined;
      const serverMessage = responseData?.message;

      // Use predefined message or server message or generic message
      const message =
        ERROR_MESSAGES[status] || serverMessage || `API 请求失败 (${status}): ${error.message}`;

      throw new YuqueApiError(message, status, error);
    }
  );
}

/**
 * Creates a configured Axios instance for Yuque API with error handling
 */
export function createAxiosInstance(
  apiToken: string = "",
  baseURL: string = "https://www.yuque.com/api/v2"
): AxiosInstance {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiToken) {
    headers["X-Auth-Token"] = apiToken;
  }

  const client = axios.create({
    baseURL,
    headers,
    timeout: 30000, // 30 seconds timeout
  });

  // Setup retry logic
  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      // Retry on network errors or 5xx server errors
      // Also retry on 429 Too Many Requests
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
    },
  });

  // Setup error handling interceptor
  setupErrorInterceptor(client);

  return client;
}

/**
 * Base service class that uses a shared Axios instance
 */
export abstract class BaseService {
  protected readonly client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }
}

/**
 * Legacy YuqueClient for backward compatibility
 * @deprecated Use createAxiosInstance and BaseService instead
 */
export class YuqueClient {
  protected client!: AxiosInstance;
  private baseURL: string;
  private apiToken: string;

  constructor(
    apiTokenOrClient: string | AxiosInstance = "",
    baseURL: string = "https://www.yuque.com/api/v2"
  ) {
    if (typeof apiTokenOrClient !== "string" && "request" in apiTokenOrClient) {
      this.client = apiTokenOrClient;
      // Extract existing config from client if available, otherwise default
      this.apiToken = ""; // Not needed when passing instance
      this.baseURL = baseURL; // Might not match instance but kept for compatibility
    } else {
      this.apiToken = apiTokenOrClient as string;
      this.baseURL = baseURL;
      this.initClient();
    }
  }

  private initClient() {
    this.client = createAxiosInstance(this.apiToken, this.baseURL);
  }

  getApiToken(): string {
    return this.apiToken;
  }

  getBaseUrl(): string {
    return this.baseURL;
  }

  updateApiToken(newToken: string): void {
    this.apiToken = newToken;
    this.initClient();
  }

  updateBaseUrl(newBaseUrl: string): void {
    this.baseURL = newBaseUrl;
    this.initClient();
  }

  updateConfig(newToken?: string, newBaseUrl?: string): void {
    if (newToken) {
      this.apiToken = newToken;
    }
    if (newBaseUrl) {
      this.baseURL = newBaseUrl;
    }
    this.initClient();
  }

  async hello(): Promise<{ message: string }> {
    const response = await this.client.get("/hello");
    return response.data.data;
  }

  /**
   * Get the underlying Axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}
