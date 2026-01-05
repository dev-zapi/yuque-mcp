import { YuqueClient } from './client';
import { UserService } from './user';
import { GroupService } from './group';
import { RepoService } from './repo';
import { DocumentService } from './document';
import { TocService } from './toc';
import { SearchService } from './search';
import { StatisticsService } from './statistics';

/**
 * Main Yuque Service that combines all sub-services
 */
export class YuqueService {
  private client: YuqueClient;
  private userService: UserService;
  private groupService: GroupService;
  private repoService: RepoService;
  private documentService: DocumentService;
  private tocService: TocService;
  private searchService: SearchService;
  private statisticsService: StatisticsService;

  constructor(apiToken: string = '', baseURL: string = 'https://www.yuque.com/api/v2') {
    // Initialize base client
    this.client = new YuqueClient(apiToken, baseURL);
    
    // Initialize all sub-services
    this.userService = new UserService(apiToken, baseURL);
    this.groupService = new GroupService(apiToken, baseURL);
    this.repoService = new RepoService(apiToken, baseURL);
    this.documentService = new DocumentService(apiToken, baseURL);
    this.tocService = new TocService(apiToken, baseURL);
    this.searchService = new SearchService(apiToken, baseURL);
    this.statisticsService = new StatisticsService(apiToken, baseURL);
  }

  // Configuration methods
  getApiToken(): string {
    return this.client.getApiToken();
  }

  getBaseUrl(): string {
    return this.client.getBaseUrl();
  }

  updateApiToken(newToken: string): void {
    this.client.updateApiToken(newToken);
    this.userService.updateApiToken(newToken);
    this.groupService.updateApiToken(newToken);
    this.repoService.updateApiToken(newToken);
    this.documentService.updateApiToken(newToken);
    this.tocService.updateApiToken(newToken);
    this.searchService.updateApiToken(newToken);
    this.statisticsService.updateApiToken(newToken);
  }

  updateBaseUrl(newBaseUrl: string): void {
    this.client.updateBaseUrl(newBaseUrl);
    this.userService.updateBaseUrl(newBaseUrl);
    this.groupService.updateBaseUrl(newBaseUrl);
    this.repoService.updateBaseUrl(newBaseUrl);
    this.documentService.updateBaseUrl(newBaseUrl);
    this.tocService.updateBaseUrl(newBaseUrl);
    this.searchService.updateBaseUrl(newBaseUrl);
    this.statisticsService.updateBaseUrl(newBaseUrl);
  }

  updateConfig(newToken?: string, newBaseUrl?: string): void {
    this.client.updateConfig(newToken, newBaseUrl);
    this.userService.updateConfig(newToken, newBaseUrl);
    this.groupService.updateConfig(newToken, newBaseUrl);
    this.repoService.updateConfig(newToken, newBaseUrl);
    this.documentService.updateConfig(newToken, newBaseUrl);
    this.tocService.updateConfig(newToken, newBaseUrl);
    this.searchService.updateConfig(newToken, newBaseUrl);
    this.statisticsService.updateConfig(newToken, newBaseUrl);
  }

  // Health check
  async hello() {
    return this.client.hello();
  }

  // User methods
  async getCurrentUser() {
    return this.userService.getCurrentUser();
  }

  async getUserDocs() {
    return this.userService.getUserDocs();
  }

  async getUserGroups(id: string, role?: number, offset?: number) {
    return this.userService.getUserGroups(id, role, offset);
  }

  // Group methods
  async getGroupMembers(login: string, role?: number, offset?: number) {
    return this.groupService.getGroupMembers(login, role, offset);
  }

  async updateGroupMember(login: string, id: string, role: number) {
    return this.groupService.updateGroupMember(login, id, role);
  }

  async deleteGroupMember(login: string, id: string) {
    return this.groupService.deleteGroupMember(login, id);
  }

  // Repository methods
  async getUserRepos(login: string, offset?: number, limit?: number, type?: string) {
    return this.repoService.getUserRepos(login, offset, limit, type);
  }

  async getGroupRepos(login: string, offset?: number, limit?: number, type?: string) {
    return this.repoService.getGroupRepos(login, offset, limit, type);
  }

  async getRepo(namespace: string) {
    return this.repoService.getRepo(namespace);
  }

  async createRepo(
    login: string,
    name: string,
    slug: string,
    description?: string,
    public_level: number = 0,
    enhancedPrivacy?: boolean
  ) {
    return this.repoService.createRepo(login, name, slug, description, public_level, enhancedPrivacy);
  }

  async createGroupRepo(
    login: string,
    name: string,
    slug: string,
    description?: string,
    public_level: number = 0,
    enhancedPrivacy?: boolean
  ) {
    return this.repoService.createGroupRepo(login, name, slug, description, public_level, enhancedPrivacy);
  }

  async updateRepo(namespace: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    public?: number;
    toc?: string;
  }) {
    return this.repoService.updateRepo(namespace, data);
  }

  async deleteRepo(namespace: string) {
    return this.repoService.deleteRepo(namespace);
  }

  // Document methods
  async getRepoDocs(
    namespace: string,
    offset?: number,
    limit?: number,
    optional_properties?: string
  ) {
    return this.documentService.getRepoDocs(namespace, offset, limit, optional_properties);
  }

  async getDoc(namespace: string, slug: string, page?: number, page_size?: number) {
    return this.documentService.getDoc(namespace, slug, page, page_size);
  }

  async createDoc(
    namespace: string,
    title: string,
    slug: string,
    body: string,
    format: string = 'markdown',
    public_level: number = 1
  ) {
    return this.documentService.createDoc(namespace, title, slug, body, format, public_level);
  }

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
  ) {
    return this.documentService.updateDoc(namespace, id, data);
  }

  async deleteDoc(namespace: string, id: number) {
    return this.documentService.deleteDoc(namespace, id);
  }

  async getDocVersions(doc_id: number) {
    return this.documentService.getDocVersions(doc_id);
  }

  async getDocVersion(id: number) {
    return this.documentService.getDocVersion(id);
  }

  // TOC methods
  async getRepoToc(namespace: string) {
    return this.tocService.getRepoToc(namespace);
  }

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
  }) {
    return this.tocService.updateRepoToc(namespace, data);
  }

  // Search methods
  async search(
    q: string,
    type: 'doc' | 'repo',
    scope?: string,
    page?: number,
    creator?: string
  ) {
    return this.searchService.search(q, type, scope, page, creator);
  }

  // Statistics methods
  async getGroupStatistics(login: string) {
    return this.statisticsService.getGroupStatistics(login);
  }

  async getGroupMemberStatistics(login: string, params?: {
    name?: string;
    range?: number;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'desc' | 'asc';
  }) {
    return this.statisticsService.getGroupMemberStatistics(login, params);
  }

  async getGroupBookStatistics(login: string, params?: {
    name?: string;
    range?: number;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'desc' | 'asc';
  }) {
    return this.statisticsService.getGroupBookStatistics(login, params);
  }

  async getGroupDocStatistics(login: string, params?: {
    bookId?: number;
    name?: string;
    range?: number;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'desc' | 'asc';
  }) {
    return this.statisticsService.getGroupDocStatistics(login, params);
  }
}

// Re-export all types
export * from '../types';
