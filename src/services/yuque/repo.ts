import { YuqueClient } from './client';
import { YuqueRepo } from '../types';

/**
 * Repository (Book) management operations
 */
export class RepoService extends YuqueClient {
  // Get user's repositories
  async getUserRepos(login: string, offset?: number, limit?: number, type?: string): Promise<YuqueRepo[]> {
    const params: any = {};
    if (offset !== undefined) params.offset = offset;
    if (limit !== undefined) params.limit = limit;
    if (type !== undefined) params.type = type;
    
    const response = await this.client.get(`/users/${login}/repos`, { params });
    return response.data.data;
  }

  // Get group's repositories
  async getGroupRepos(login: string, offset?: number, limit?: number, type?: string): Promise<YuqueRepo[]> {
    const params: any = {};
    if (offset !== undefined) params.offset = offset;
    if (limit !== undefined) params.limit = limit;
    if (type !== undefined) params.type = type;
    
    const response = await this.client.get(`/groups/${login}/repos`, { params });
    return response.data.data;
  }

  // Get single repository by namespace
  async getRepo(namespace: string): Promise<YuqueRepo> {
    const response = await this.client.get(`/repos/${namespace}`);
    return response.data.data;
  }

  // Create user repository
  async createRepo(
    login: string,
    name: string,
    slug: string,
    description?: string,
    public_level: number = 0,
    enhancedPrivacy?: boolean
  ): Promise<YuqueRepo> {
    const data: any = {
      name,
      slug,
      public: public_level
    };
    
    if (description !== undefined) data.description = description;
    if (enhancedPrivacy !== undefined) data.enhancedPrivacy = enhancedPrivacy;
    
    const response = await this.client.post(`/users/${login}/repos`, data);
    return response.data.data;
  }

  // Create group repository
  async createGroupRepo(
    login: string,
    name: string,
    slug: string,
    description?: string,
    public_level: number = 0,
    enhancedPrivacy?: boolean
  ): Promise<YuqueRepo> {
    const data: any = {
      name,
      slug,
      public: public_level
    };
    
    if (description !== undefined) data.description = description;
    if (enhancedPrivacy !== undefined) data.enhancedPrivacy = enhancedPrivacy;
    
    const response = await this.client.post(`/groups/${login}/repos`, data);
    return response.data.data;
  }

  // Update repository
  async updateRepo(namespace: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    public?: number;
    toc?: string;
  }): Promise<YuqueRepo> {
    const response = await this.client.put(`/repos/${namespace}`, data);
    return response.data.data;
  }

  // Delete repository
  async deleteRepo(namespace: string): Promise<YuqueRepo> {
    const response = await this.client.delete(`/repos/${namespace}`);
    return response.data.data;
  }
}
