import { YuqueClient } from './client';

/**
 * Statistics and analytics operations
 */
export class StatisticsService extends YuqueClient {
  // Get group summary statistics
  async getGroupStatistics(login: string): Promise<any> {
    const response = await this.client.get(`/groups/${login}/statistics`);
    return response.data.data;
  }

  // Get group member statistics
  async getGroupMemberStatistics(login: string, params?: {
    name?: string;
    range?: number;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'desc' | 'asc';
  }): Promise<any> {
    const response = await this.client.get(`/groups/${login}/statistics/members`, { params });
    return response.data.data;
  }

  // Get group repository statistics
  async getGroupBookStatistics(login: string, params?: {
    name?: string;
    range?: number;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'desc' | 'asc';
  }): Promise<any> {
    const response = await this.client.get(`/groups/${login}/statistics/books`, { params });
    return response.data.data;
  }

  // Get group document statistics
  async getGroupDocStatistics(login: string, params?: {
    bookId?: number;
    name?: string;
    range?: number;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'desc' | 'asc';
  }): Promise<any> {
    const response = await this.client.get(`/groups/${login}/statistics/docs`, { params });
    return response.data.data;
  }
}
