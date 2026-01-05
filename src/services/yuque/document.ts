import { YuqueClient } from './client';
import { YuqueDoc, YuqueDocVersion, YuqueDocVersionDetail } from '../types';

/**
 * Document management operations
 */
export class DocumentService extends YuqueClient {
  // Get all documents in a repository
  async getRepoDocs(
    namespace: string,
    offset?: number,
    limit?: number,
    optional_properties?: string
  ): Promise<YuqueDoc[]> {
    const params: any = {};
    if (offset !== undefined) params.offset = offset;
    if (limit !== undefined) params.limit = limit;
    if (optional_properties !== undefined) params.optional_properties = optional_properties;
    
    const response = await this.client.get(`/repos/${namespace}/docs`, { params });
    return response.data.data;
  }

  // Get single document
  async getDoc(namespace: string, slug: string, page?: number, page_size?: number): Promise<YuqueDoc> {
    const params: any = {};
    if (page !== undefined) params.page = page;
    if (page_size !== undefined) params.page_size = page_size;
    
    const response = await this.client.get(`/repos/${namespace}/docs/${slug}`, { params });
    
    // Filter out unnecessary raw format content
    if (response.data.data.body_lake) delete response.data.data.body_lake;
    if (response.data.data.body_draft) delete response.data.data.body_draft;
    if (response.data.data.body_html) delete response.data.data.body_html;
    
    return response.data.data;
  }

  // Create document
  async createDoc(
    namespace: string,
    title: string,
    slug: string,
    body: string,
    format: string = 'markdown',
    public_level: number = 1
  ): Promise<YuqueDoc> {
    const response = await this.client.post(`/repos/${namespace}/docs`, {
      title,
      slug,
      public: public_level,
      format,
      body,
    });
    return response.data.data;
  }

  // Update document
  async updateDoc(
    namespace: string,
    id: number,
    data: {
      title?: string;
      slug?: string;
      body?: string;
      public?: number;
      format?: string;
    }
  ): Promise<YuqueDoc> {
    const response = await this.client.put(`/repos/${namespace}/docs/${id}`, data);
    return response.data.data;
  }

  // Delete document
  async deleteDoc(namespace: string, id: number): Promise<YuqueDoc> {
    const response = await this.client.delete(`/repos/${namespace}/docs/${id}`);
    return response.data.data;
  }

  // Get document versions
  async getDocVersions(doc_id: number): Promise<YuqueDocVersion[]> {
    const response = await this.client.get('/doc_versions', { params: { doc_id } });
    return response.data.data;
  }

  // Get single document version
  async getDocVersion(id: number): Promise<YuqueDocVersionDetail> {
    const response = await this.client.get(`/doc_versions/${id}`);
    return response.data.data;
  }
}
