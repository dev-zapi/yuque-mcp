import { AxiosInstance } from "axios";
import { BaseService } from "./client";
import { YuqueSearchResult } from "../types";

interface SearchParams {
  q: string;
  type: "doc" | "repo";
  scope?: string;
  page?: number;
  creator?: string;
}

/**
 * Search operations
 */
export class SearchService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  // Search documents or repositories
  async search(
    q: string,
    type: "doc" | "repo",
    scope?: string,
    page?: number,
    creator?: string
  ): Promise<YuqueSearchResult[]> {
    const params: SearchParams = { q, type };
    if (scope) params.scope = scope;
    if (page) params.page = page;
    if (creator) params.creator = creator;

    const response = await this.client.get("/search", { params });
    return response.data.data;
  }
}
