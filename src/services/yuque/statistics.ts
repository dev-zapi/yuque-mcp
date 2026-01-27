import { AxiosInstance } from "axios";
import { BaseService } from "./client";
import {
  YuqueGroupStatistics,
  YuqueMemberStatistics,
  YuqueBookStatistics,
  YuqueDocStatistics,
  YuqueStatisticsQueryParams,
  YuqueDocStatisticsQueryParams,
} from "../types";

/**
 * Statistics and analytics operations
 */
export class StatisticsService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  // Get group summary statistics
  async getGroupStatistics(login: string): Promise<YuqueGroupStatistics> {
    const response = await this.client.get(`/groups/${login}/statistics`);
    return response.data.data;
  }

  // Get group member statistics
  async getGroupMemberStatistics(
    login: string,
    params?: YuqueStatisticsQueryParams
  ): Promise<YuqueMemberStatistics[]> {
    const response = await this.client.get(`/groups/${login}/statistics/members`, { params });
    return response.data.data;
  }

  // Get group repository statistics
  async getGroupBookStatistics(
    login: string,
    params?: YuqueStatisticsQueryParams
  ): Promise<YuqueBookStatistics[]> {
    const response = await this.client.get(`/groups/${login}/statistics/books`, { params });
    return response.data.data;
  }

  // Get group document statistics
  async getGroupDocStatistics(
    login: string,
    params?: YuqueDocStatisticsQueryParams
  ): Promise<YuqueDocStatistics[]> {
    const response = await this.client.get(`/groups/${login}/statistics/docs`, { params });
    return response.data.data;
  }
}
