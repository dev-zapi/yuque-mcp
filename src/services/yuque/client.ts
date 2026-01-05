import axios, { AxiosInstance } from 'axios';

/**
 * Base client for Yuque API
 */
export class YuqueClient {
  protected client!: AxiosInstance;
  private baseURL: string;
  private apiToken: string;

  constructor(apiToken: string = '', baseURL: string = 'https://www.yuque.com/api/v2') {
    this.apiToken = apiToken;
    this.baseURL = baseURL;
    this.initClient();
  }

  // Initialize HTTP client
  private initClient() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Only add token to headers if it's not empty
    if (this.apiToken) {
      headers['X-Auth-Token'] = this.apiToken;
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers,
    });
  }

  // Getter methods
  getApiToken(): string {
    return this.apiToken;
  }

  getBaseUrl(): string {
    return this.baseURL;
  }
  
  // Update API Token
  updateApiToken(newToken: string): void {
    this.apiToken = newToken;
    this.initClient();
  }
  
  // Update Base URL
  updateBaseUrl(newBaseUrl: string): void {
    this.baseURL = newBaseUrl;
    this.initClient();
  }
  
  // Update both Token and Base URL
  updateConfig(newToken?: string, newBaseUrl?: string): void {
    if (newToken) {
      this.apiToken = newToken;
    }
    if (newBaseUrl) {
      this.baseURL = newBaseUrl;
    }
    this.initClient();
  }

  // Health check
  async hello(): Promise<{ message: string }> {
    const response = await this.client.get('/hello');
    return response.data.data;
  }
}
