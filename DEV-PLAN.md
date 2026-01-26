# Yuque MCP Server 开发优化计划

> 创建时间：2026-01-26
> 状态：待执行

## 📋 任务概览

| 阶段 | 任务数 | 预计工时 | 优先级 |
|------|--------|----------|--------|
| Phase 1: 基础设施 | 3 | 2h | 🔴 高 |
| Phase 2: 架构重构 | 3 | 3h | 🔴 高 |
| Phase 3: 代码质量 | 3 | 2h | 🟡 中 |
| Phase 4: 测试覆盖 | 2 | 3h | 🟡 中 |
| Phase 5: 增强功能 | 3 | 2h | 🟢 低 |

---

## Phase 1: 基础设施建设 🔴

### Task 1.1: 添加 ESLint + Prettier 配置
- **Agent**: `developer`
- **优先级**: 高
- **预计工时**: 30min
- **描述**: 配置代码规范工具，确保代码风格一致

**执行步骤**:
1. 安装依赖：`npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier`
2. 创建 `.eslintrc.json` 配置文件
3. 创建 `.prettierrc` 配置文件
4. 添加 npm scripts: `lint`, `lint:fix`, `format`
5. 运行 `npm run lint:fix` 修复现有问题

**验收标准**:
- [ ] `npm run lint` 无错误
- [ ] `npm run format` 可格式化代码
- [ ] 配置与现有代码风格一致（2空格、双引号、分号）

---

### Task 1.2: 添加测试框架 Vitest
- **Agent**: `developer`
- **优先级**: 高
- **预计工时**: 30min
- **描述**: 配置测试框架，为后续测试做准备

**执行步骤**:
1. 安装依赖：`npm install -D vitest @vitest/coverage-v8`
2. 创建 `vitest.config.ts` 配置文件
3. 添加 npm scripts: `test`, `test:watch`, `test:coverage`
4. 创建 `test/` 目录结构
5. 添加一个示例测试验证配置

**验收标准**:
- [ ] `npm run test` 可运行
- [ ] 测试覆盖率报告可生成
- [ ] 示例测试通过

---

### Task 1.3: 优化 Logger 实现
- **Agent**: `developer`
- **优先级**: 高
- **预计工时**: 30min
- **描述**: 改进日志系统，支持启动阶段日志

**修改文件**: `src/server.ts`

**执行步骤**:
1. 修改 Logger 默认实现使用 console
2. 添加日志级别支持
3. 添加时间戳前缀
4. 连接后切换到 MCP 日志

**代码示例**:
```typescript
export const Logger = {
  log: (...args: any[]) => console.log(`[${new Date().toISOString()}] [Yuque MCP]`, ...args),
  error: (...args: any[]) => console.error(`[${new Date().toISOString()}] [Yuque MCP Error]`, ...args),
};
```

**验收标准**:
- [ ] 启动时可看到日志输出
- [ ] 连接后日志发送到 MCP client
- [ ] 类型检查通过

---

## Phase 2: 架构重构 🔴

### Task 2.1: 重构服务架构 - 共享 Axios 实例
- **Agent**: `developer`
- **优先级**: 高
- **预计工时**: 1.5h
- **描述**: 消除8个独立 axios 实例，改为共享单一实例

**修改文件**:
- `src/services/yuque/client.ts`
- `src/services/yuque/index.ts`
- `src/services/yuque/*.ts` (所有子服务)

**执行步骤**:
1. 修改 `YuqueClient` 支持接收外部 axios 实例
2. 创建 `BaseService` 抽象类接收共享 client
3. 修改所有子服务继承 `BaseService`
4. 修改 `YuqueService` 传递共享实例
5. 简化 `updateApiToken` 等方法

**代码示例**:
```typescript
// client.ts
export class YuqueClient {
  protected client: AxiosInstance;
  
  constructor(client?: AxiosInstance, apiToken?: string, baseURL?: string) {
    if (client) {
      this.client = client;
    } else {
      this.client = this.createClient(apiToken, baseURL);
    }
  }
}

// user.ts
export class UserService {
  constructor(private client: AxiosInstance) {}
}

// index.ts
export class YuqueService {
  constructor(apiToken: string, baseURL: string) {
    const client = this.createAxiosInstance(apiToken, baseURL);
    this.userService = new UserService(client);
    this.groupService = new GroupService(client);
    // ...
  }
}
```

**验收标准**:
- [ ] 只创建一个 axios 实例
- [ ] 所有 API 调用正常工作
- [ ] `updateApiToken` 只需更新一处
- [ ] 类型检查通过
- [ ] 构建成功

---

### Task 2.2: 消除 `any` 类型 - 定义统计接口
- **Agent**: `developer`
- **优先级**: 高
- **预计工时**: 1h
- **描述**: 为 statistics 服务定义具体类型

**修改文件**:
- `src/services/types.ts`
- `src/services/yuque/statistics.ts`
- `src/services/yuque/document.ts`

**执行步骤**:
1. 在 `types.ts` 添加统计相关接口
2. 添加分页参数接口 `YuquePaginatedParams`
3. 更新 `StatisticsService` 返回类型
4. 更新 `DocumentService` 的 params 类型
5. 检查并修复所有 `any` 使用

**新增类型**:
```typescript
export interface YuqueGroupStatistics {
  member_count: number;
  doc_count: number;
  word_count: number;
  read_count: number;
  like_count: number;
  comment_count: number;
}

export interface YuqueMemberStatistics {
  user: YuqueUser;
  write_doc_count: number;
  write_count: number;
  read_count: number;
  like_count: number;
}

export interface YuquePaginatedParams {
  offset?: number;
  limit?: number;
  page?: number;
}

export interface YuquePaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
```

**验收标准**:
- [ ] `statistics.ts` 无 `any` 类型
- [ ] `document.ts` 无 `any` 类型
- [ ] 类型检查通过（`npm run type-check`）

---

### Task 2.3: 添加统一错误处理
- **Agent**: `developer`
- **优先级**: 高
- **预计工时**: 30min
- **描述**: 在 axios client 添加响应拦截器统一处理错误

**修改文件**: `src/services/yuque/client.ts`

**执行步骤**:
1. 添加请求超时配置（30秒）
2. 添加响应拦截器处理常见错误
3. 创建自定义错误类 `YuqueApiError`
4. 将 API 错误转换为友好的中文消息

**代码示例**:
```typescript
export class YuqueApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'YuqueApiError';
  }
}

// 在 initClient 中添加
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const messages: Record<number, string> = {
      401: '认证失败：请检查 API Token 是否有效',
      403: '权限不足：无权访问该资源',
      404: '资源不存在：请检查 namespace 或 slug 是否正确',
      429: '请求过于频繁：请稍后重试',
      500: '服务器错误：语雀服务暂时不可用',
    };
    throw new YuqueApiError(
      messages[status] || error.response?.data?.message || error.message,
      status,
      error
    );
  }
);
```

**验收标准**:
- [ ] 401 错误返回友好提示
- [ ] 404 错误返回友好提示
- [ ] 超时有合理处理
- [ ] 类型检查通过

---

## Phase 3: 代码质量改进 🟡

### Task 3.1: 拆分 server.ts - 工具注册模块化
- **Agent**: `developer`
- **优先级**: 中
- **预计工时**: 1h
- **描述**: 将 1000+ 行的 server.ts 拆分为多个模块

**新建文件**:
- `src/tools/index.ts` - 工具注册入口
- `src/tools/user-tools.ts` - 用户相关工具
- `src/tools/doc-tools.ts` - 文档相关工具
- `src/tools/repo-tools.ts` - 知识库相关工具
- `src/tools/stats-tools.ts` - 统计相关工具
- `src/tools/search-tools.ts` - 搜索相关工具

**执行步骤**:
1. 创建 `src/tools/` 目录
2. 定义工具注册函数接口
3. 将各类工具拆分到对应文件
4. 在 `index.ts` 统一导出并注册
5. 简化 `server.ts` 的 `registerTools` 方法

**代码示例**:
```typescript
// src/tools/types.ts
export type ToolRegistrar = (
  server: McpServer,
  createService: (token?: string) => YuqueService
) => void;

// src/tools/user-tools.ts
export const registerUserTools: ToolRegistrar = (server, createService) => {
  server.tool("get_current_user", ...);
  server.tool("get_user_docs", ...);
};

// src/tools/index.ts
export function registerAllTools(server: McpServer, createService: Function) {
  registerUserTools(server, createService);
  registerDocTools(server, createService);
  // ...
}
```

**验收标准**:
- [ ] `server.ts` 减少到 300 行以内
- [ ] 所有工具正常工作
- [ ] 类型检查通过
- [ ] 构建成功

---

### Task 3.2: 消除 server.ts 中的 `any` 类型
- **Agent**: `developer`
- **优先级**: 中
- **预计工时**: 30min
- **描述**: 为 splitDocumentContent 等方法定义具体类型

**修改文件**: `src/server.ts`

**执行步骤**:
1. 定义 `DocChunk` 接口
2. 定义 `ChunkInfo` 接口
3. 更新 `splitDocumentContent` 参数和返回类型
4. 更新工具处理函数中的类型

**验收标准**:
- [ ] `server.ts` 无 `any` 类型（Logger 参数除外）
- [ ] 类型检查通过

---

### Task 3.3: 代码审查和安全检查
- **Agent**: `security-reviewer`
- **优先级**: 中
- **预计工时**: 30min
- **描述**: 检查代码安全问题

**检查项目**:
1. Token 处理是否安全
2. 错误消息是否泄露敏感信息
3. 输入验证是否充分
4. 依赖是否有已知漏洞

**执行命令**:
```bash
npm audit
```

**验收标准**:
- [ ] 无高危漏洞
- [ ] Token 不会被日志记录
- [ ] 错误消息不泄露内部信息

---

## Phase 4: 测试覆盖 🟡

### Task 4.1: 编写单元测试 - Services
- **Agent**: `tdd-guide`
- **优先级**: 中
- **预计工时**: 2h
- **描述**: 为核心服务编写单元测试

**新建文件**:
- `test/services/client.test.ts`
- `test/services/user.test.ts`
- `test/services/document.test.ts`
- `test/services/yuque-service.test.ts`

**执行步骤**:
1. 设置测试 mock（axios mock）
2. 编写 YuqueClient 测试
3. 编写 UserService 测试
4. 编写 DocumentService 测试
5. 编写集成测试

**测试用例示例**:
```typescript
describe('YuqueClient', () => {
  it('should create client with correct headers', () => {});
  it('should handle 401 error correctly', () => {});
  it('should update token correctly', () => {});
});

describe('DocumentService', () => {
  it('should get document by slug', () => {});
  it('should filter out body_lake from response', () => {});
  it('should create document with correct params', () => {});
});
```

**验收标准**:
- [ ] 测试覆盖率 > 60%
- [ ] 所有测试通过
- [ ] Mock 正确设置

---

### Task 4.2: 编写单元测试 - Tools & Hooks
- **Agent**: `tdd-guide`
- **优先级**: 中
- **预计工时**: 1h
- **描述**: 为工具和钩子函数编写测试

**新建文件**:
- `test/mcp_hook.test.ts`
- `test/tools/doc-tools.test.ts`

**测试用例**:
```typescript
describe('getFixedQuery', () => {
  it('should extract sessionId from query string', () => {});
  it('should skip empty string values', () => {});
  it('should handle normal query params', () => {});
});

describe('splitDocumentContent', () => {
  it('should not split small documents', () => {});
  it('should split large documents correctly', () => {});
  it('should include overlap between chunks', () => {});
});
```

**验收标准**:
- [ ] mcp_hook 测试覆盖率 > 80%
- [ ] splitDocumentContent 测试覆盖率 100%
- [ ] 所有测试通过

---

## Phase 5: 增强功能 🟢

### Task 5.1: 添加请求重试机制
- **Agent**: `developer`
- **优先级**: 低
- **预计工时**: 30min
- **描述**: 为 API 请求添加自动重试

**修改文件**: `src/services/yuque/client.ts`

**执行步骤**:
1. 安装 `axios-retry`
2. 配置重试策略（3次，指数退避）
3. 仅对 5xx 和 429 错误重试

**验收标准**:
- [ ] 429 错误自动重试
- [ ] 5xx 错误自动重试
- [ ] 重试次数可配置

---

### Task 5.2: 增强健康检查端点
- **Agent**: `developer`
- **优先级**: 低
- **预计工时**: 30min
- **描述**: 添加更多健康检查信息

**修改文件**: `src/server.ts`

**增强内容**:
1. 添加 uptime 信息
2. 添加内存使用信息
3. 可选检查 Yuque API 连接
4. 添加版本信息

**验收标准**:
- [ ] 健康检查返回详细信息
- [ ] 降级状态正确报告
- [ ] 不影响现有功能

---

### Task 5.3: 添加请求日志中间件
- **Agent**: `developer`
- **优先级**: 低
- **预计工时**: 30min
- **描述**: 记录 HTTP 请求日志用于调试

**修改文件**: `src/server.ts`

**执行步骤**:
1. 添加请求日志中间件
2. 记录请求方法、路径、耗时
3. 可通过环境变量控制开关

**验收标准**:
- [ ] 请求日志可记录
- [ ] 可通过 LOG_REQUESTS=true 开启
- [ ] 不记录敏感信息

---

## 📅 执行顺序建议

```
Week 1:
├── Day 1: Task 1.1 + 1.2 (基础设施)
├── Day 2: Task 1.3 + 2.3 (Logger + 错误处理)
└── Day 3: Task 2.1 (架构重构 - 共享实例)

Week 2:
├── Day 1: Task 2.2 (消除 any 类型)
├── Day 2: Task 3.1 (拆分 server.ts)
└── Day 3: Task 3.2 + 3.3 (代码质量 + 安全检查)

Week 3:
├── Day 1-2: Task 4.1 (Services 测试)
├── Day 3: Task 4.2 (Tools 测试)
└── Day 4: Task 5.1 + 5.2 + 5.3 (增强功能)
```

---

## 🎯 完成标准

所有任务完成后，项目应满足：

1. **代码质量**
   - ESLint 无错误
   - TypeScript 严格模式无 `any`
   - 测试覆盖率 > 60%

2. **架构**
   - 单一 axios 实例
   - 模块化工具注册
   - 统一错误处理

3. **可维护性**
   - server.ts < 300 行
   - 清晰的目录结构
   - 完善的类型定义

4. **可靠性**
   - 请求自动重试
   - 友好的错误提示
   - 健康检查完善

---

## 📝 备注

- 每个任务完成后运行 `npm run build && npm run type-check` 确保无错误
- 重构任务应保持向后兼容
- 测试任务可使用 mock 避免真实 API 调用
- 建议按 Phase 顺序执行，避免依赖问题
