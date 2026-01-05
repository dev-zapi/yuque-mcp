// Yuque API Type Definitions

export interface YuqueUser {
  id: number;
  type?: string;
  login: string;
  name: string;
  description: string;
  avatar_url: string;
  books_count?: number;
  public_books_count?: number;
  followers_count?: number;
  following_count?: number;
  public?: number;
  created_at: string;
  updated_at: string;
}

export interface YuqueGroup {
  id: number;
  type?: string;
  login: string;
  name: string;
  description: string;
  avatar_url: string;
  books_count?: number;
  public_books_count?: number;
  members_count?: number;
  public?: number;
  created_at: string;
  updated_at: string;
}

export interface YuqueGroupUser {
  id: number;
  group_id: number;
  user_id: number;
  role: number;
  created_at: string;
  updated_at: string;
  group?: YuqueGroup;
  user?: YuqueUser;
}

export interface YuqueDoc {
  id: number;
  slug: string;
  title: string;
  description: string;
  user_id: number;
  book_id: number;
  format: string;
  public: number;
  status: number;
  likes_count: number;
  read_count?: number;
  comments_count: number;
  content_updated_at: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  first_published_at?: string;
  word_count: number;
  body?: string;
  body_html?: string;
  body_lake?: string;
  body_draft?: string;
  book?: YuqueRepo;
  user?: YuqueUser;
  last_editor?: YuqueUser;
  creator?: YuqueUser;
}

export interface YuqueRepo {
  id: number;
  type: string;
  slug: string;
  name: string;
  user_id: number;
  description: string;
  public: number;
  items_count: number;
  likes_count: number;
  watches_count: number;
  content_updated_at: string;
  created_at: string;
  updated_at: string;
  namespace: string;
  user?: YuqueUser;
  toc_yml?: string;
}

export interface YuqueDocVersion {
  id: number;
  doc_id: number;
  slug: string;
  title: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: YuqueUser;
}

export interface YuqueDocVersionDetail extends YuqueDocVersion {
  format: string;
  body: string;
  body_html?: string;
  body_asl?: string;
  diff?: string;
}

export interface YuqueTocItem {
  uuid: string;
  type: 'DOC' | 'LINK' | 'TITLE';
  title: string;
  url?: string;
  doc_id?: number;
  level: number;
  open_window?: number;
  visible: number;
  prev_uuid?: string;
  sibling_uuid?: string;
  child_uuid?: string;
  parent_uuid?: string;
}

export interface YuqueSearchResult {
  id: number;
  type: 'doc' | 'repo';
  title: string;
  summary: string;
  url: string;
  info: string;
  target: YuqueDoc | YuqueRepo;
}

export interface YuqueTag {
  id: number;
  title: string;
  doc_id: number;
  book_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}
