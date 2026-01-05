import { YuqueClient } from './client';
import { YuqueUser, YuqueDoc, YuqueGroup } from '../types';

/**
 * User-related API operations
 */
export class UserService extends YuqueClient {
  // Get current authenticated user
  async getCurrentUser(): Promise<YuqueUser> {
    const response = await this.client.get('/user');
    return response.data.data;
  }

  // Get current user's documents
  async getUserDocs(): Promise<YuqueDoc[]> {
    const response = await this.client.get('/user/docs');
    return response.data.data;
  }

  // Get user's groups
  async getUserGroups(id: string, role?: number, offset?: number): Promise<YuqueGroup[]> {
    const params: any = {};
    if (role !== undefined) params.role = role;
    if (offset !== undefined) params.offset = offset;
    
    const response = await this.client.get(`/users/${id}/groups`, { params });
    return response.data.data;
  }
}
