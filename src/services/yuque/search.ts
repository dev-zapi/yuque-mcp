import { YuqueClient } from './client';
import { YuqueSearchResult } from '../types';

/**
 * Search operations
 */
export class SearchService extends YuqueClient {
  // Search documents or repositories
  async search(
    q: string,
    type: 'doc' | 'repo',
    scope?: string,
    page?: number,
    creator?: string
  ): Promise<YuqueSearchResult[]> {
    const params: any = { q, type };
    if (scope) params.scope = scope;
    if (page) params.page = page;
    if (creator) params.creator = creator;

    const response = await this.client.get('/search', { params });
    return response.data.data;
  }
}
