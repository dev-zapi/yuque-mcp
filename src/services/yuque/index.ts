import { AxiosInstance } from "axios";
import { createAxiosInstance, YuqueClient } from "./client";
import { UserService } from "./user";
import { GroupService } from "./group";
import { RepoService } from "./repo";
import { DocumentService } from "./document";
import { TocService } from "./toc";
import { SearchService } from "./search";
import { StatisticsService } from "./statistics";

/**
 * Main Yuque Service that combines all sub-services
 * Uses a single shared Axios instance for all API calls
 */
export class YuqueService {
  private axiosInstance: AxiosInstance;
  private legacyClient: YuqueClient;
  public userService: UserService;
  public groupService: GroupService;
  public repoService: RepoService;
  public documentService: DocumentService;
  public tocService: TocService;
  public searchService: SearchService;
  public statisticsService: StatisticsService;

  constructor(apiToken: string = "", baseURL: string = "https://www.yuque.com/api/v2") {
    // Create a single shared Axios instance
    this.axiosInstance = createAxiosInstance(apiToken, baseURL);

    // Keep legacy client for configuration methods
    // We pass the axios instance to avoid creating a second one
    this.legacyClient = new YuqueClient(this.axiosInstance, baseURL);

    // Initialize all sub-services with the shared Axios instance
    this.userService = new UserService(this.axiosInstance);
    this.groupService = new GroupService(this.axiosInstance);
    this.repoService = new RepoService(this.axiosInstance);
    this.documentService = new DocumentService(this.axiosInstance);
    this.tocService = new TocService(this.axiosInstance);
    this.searchService = new SearchService(this.axiosInstance);
    this.statisticsService = new StatisticsService(this.axiosInstance);
  }

  // Configuration methods
  getApiToken(): string {
    return this.legacyClient.getApiToken();
  }

  getBaseUrl(): string {
    return this.legacyClient.getBaseUrl();
  }

  // Note: Token/URL updates now only need to update the legacy client
  // since a new YuqueService instance should be created for different configs
  updateApiToken(newToken: string): void {
    // Recreate axios instance and all services
    this.axiosInstance = createAxiosInstance(newToken, this.legacyClient.getBaseUrl());
    this.reinitializeServices();
    // Update legacy client wrapper
    this.legacyClient = new YuqueClient(this.axiosInstance, this.legacyClient.getBaseUrl());
  }

  updateBaseUrl(newBaseUrl: string): void {
    // Recreate axios instance and all services
    this.axiosInstance = createAxiosInstance(this.legacyClient.getApiToken(), newBaseUrl);
    this.reinitializeServices();
    // Update legacy client wrapper
    this.legacyClient = new YuqueClient(this.axiosInstance, newBaseUrl);
  }

  updateConfig(newToken?: string, newBaseUrl?: string): void {
    const token = newToken || this.legacyClient.getApiToken();
    const url = newBaseUrl || this.legacyClient.getBaseUrl();

    // Recreate axios instance and all services
    this.axiosInstance = createAxiosInstance(token, url);
    this.reinitializeServices();

    // Update legacy client wrapper
    this.legacyClient = new YuqueClient(this.axiosInstance, url);
  }

  private reinitializeServices(): void {
    this.userService = new UserService(this.axiosInstance);
    this.groupService = new GroupService(this.axiosInstance);
    this.repoService = new RepoService(this.axiosInstance);
    this.documentService = new DocumentService(this.axiosInstance);
    this.tocService = new TocService(this.axiosInstance);
    this.searchService = new SearchService(this.axiosInstance);
    this.statisticsService = new StatisticsService(this.axiosInstance);
  }

  // Health check
  async hello() {
    return this.legacyClient.hello();
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
    return this.repoService.createRepo(
      login,
      name,
      slug,
      description,
      public_level,
      enhancedPrivacy
    );
  }

  async createGroupRepo(
    login: string,
    name: string,
    slug: string,
    description?: string,
    public_level: number = 0,
    enhancedPrivacy?: boolean
  ) {
    return this.repoService.createGroupRepo(
      login,
      name,
      slug,
      description,
      public_level,
      enhancedPrivacy
    );
  }

  async updateRepo(
    namespace: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      public?: number;
      toc?: string;
    }
  ) {
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
    format: string = "markdown",
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

  async updateRepoToc(
    namespace: string,
    data: {
      action: "appendNode" | "prependNode" | "editNode" | "removeNode";
      action_mode: "sibling" | "child";
      target_uuid?: string;
      node_uuid?: string;
      doc_ids?: number[];
      type?: "DOC" | "LINK" | "TITLE";
      title?: string;
      url?: string;
      open_window?: number;
      visible?: number;
    }
  ) {
    return this.tocService.updateRepoToc(namespace, data);
  }

  // Search methods
  async search(q: string, type: "doc" | "repo", scope?: string, page?: number, creator?: string) {
    return this.searchService.search(q, type, scope, page, creator);
  }

  // Statistics methods
  async getGroupStatistics(login: string) {
    return this.statisticsService.getGroupStatistics(login);
  }

  async getGroupMemberStatistics(
    login: string,
    params?: {
      name?: string;
      range?: number;
      page?: number;
      limit?: number;
      sortField?: string;
      sortOrder?: "desc" | "asc";
    }
  ) {
    return this.statisticsService.getGroupMemberStatistics(login, params);
  }

  async getGroupBookStatistics(
    login: string,
    params?: {
      name?: string;
      range?: number;
      page?: number;
      limit?: number;
      sortField?: string;
      sortOrder?: "desc" | "asc";
    }
  ) {
    return this.statisticsService.getGroupBookStatistics(login, params);
  }

  async getGroupDocStatistics(
    login: string,
    params?: {
      bookId?: number;
      name?: string;
      range?: number;
      page?: number;
      limit?: number;
      sortField?: string;
      sortOrder?: "desc" | "asc";
    }
  ) {
    return this.statisticsService.getGroupDocStatistics(login, params);
  }
}

// Re-export all types
export * from "../types";
