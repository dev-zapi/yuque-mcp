import { YuqueClient } from './client';
import { YuqueGroupUser } from '../types';

/**
 * Group (Team) management operations
 */
export class GroupService extends YuqueClient {
  // Get group members
  async getGroupMembers(login: string, role?: number, offset?: number): Promise<YuqueGroupUser[]> {
    const params: any = {};
    if (role !== undefined) params.role = role;
    if (offset !== undefined) params.offset = offset;
    
    const response = await this.client.get(`/groups/${login}/users`, { params });
    return response.data.data;
  }

  // Update group member role
  async updateGroupMember(login: string, id: string, role: number): Promise<YuqueGroupUser> {
    const response = await this.client.put(`/groups/${login}/users/${id}`, { role });
    return response.data.data;
  }

  // Delete group member
  async deleteGroupMember(login: string, id: string): Promise<{ user_id: string }> {
    const response = await this.client.delete(`/groups/${login}/users/${id}`);
    return response.data.data;
  }
}
