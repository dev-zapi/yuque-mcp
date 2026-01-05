import { YuqueClient } from './client';
import { YuqueTocItem } from '../types';

/**
 * Table of Contents (TOC) management operations
 */
export class TocService extends YuqueClient {
  // Get repository TOC
  async getRepoToc(namespace: string): Promise<YuqueTocItem[]> {
    const response = await this.client.get(`/repos/${namespace}/toc`);
    return response.data.data;
  }

  // Update repository TOC
  async updateRepoToc(namespace: string, data: {
    action: 'appendNode' | 'prependNode' | 'editNode' | 'removeNode';
    action_mode: 'sibling' | 'child';
    target_uuid?: string;
    node_uuid?: string;
    doc_ids?: number[];
    type?: 'DOC' | 'LINK' | 'TITLE';
    title?: string;
    url?: string;
    open_window?: number;
    visible?: number;
  }): Promise<YuqueTocItem[]> {
    const response = await this.client.put(`/repos/${namespace}/toc`, data);
    return response.data.data;
  }
}
