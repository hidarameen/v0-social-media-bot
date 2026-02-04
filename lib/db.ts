type PgPoolConstructor = typeof import('pg').Pool;

let pgPoolConstructor: PgPoolConstructor | null = null;

const getPgPoolConstructor = (): PgPoolConstructor => {
  if (pgPoolConstructor) return pgPoolConstructor;
  const requireFunc = (0, eval)('require') as NodeRequire;
  const pgModule = requireFunc('pg') as typeof import('pg');
  pgPoolConstructor = pgModule.Pool;
  return pgPoolConstructor;
};

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformAccount {
  id: string;
  userId: string;
  platformId: string;
  accountName: string;
  accountUsername: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  credentials?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  description: string;
  sourceAccounts: string[];
  targetAccounts: string[];
  contentType: 'text' | 'image' | 'video' | 'link';
  status: 'active' | 'paused' | 'completed' | 'error';
  executionType: 'immediate' | 'scheduled' | 'recurring';
  scheduleTime?: Date;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurringDays?: number[];
  filters?: {
    keywords?: string[];
    excludeKeywords?: string[];
    minEngagement?: number;
    mediaOnly?: boolean;
  };
  transformations?: {
    addHashtags?: string[];
    prependText?: string;
    appendText?: string;
    mediaResize?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  sourceAccount: string;
  targetAccount: string;
  originalContent: string;
  transformedContent: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  executedAt: Date;
  responseData?: Record<string, any>;
}

export interface Analytics {
  id: string;
  userId: string;
  date: Date;
  platformId: string;
  accountId: string;
  posts: number;
  engagements: number;
  clicks: number;
  reach: number;
  impressions: number;
}

interface DatabaseAdapter {
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  createAccount(account: Omit<PlatformAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlatformAccount>;
  getAccount(id: string): Promise<PlatformAccount | undefined>;
  getUserAccounts(userId: string): Promise<PlatformAccount[]>;
  getPlatformAccounts(userId: string, platformId: string): Promise<PlatformAccount[]>;
  updateAccount(id: string, updates: Partial<PlatformAccount>): Promise<PlatformAccount | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'lastExecuted'>): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  getUserTasks(userId: string): Promise<Task[]>;
  getActiveTasks(): Promise<Task[]>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  createExecution(execution: Omit<TaskExecution, 'id'>): Promise<TaskExecution>;
  getTaskExecutions(taskId: string): Promise<TaskExecution[]>;
  getExecutionsByDate(userId: string, startDate: Date, endDate: Date): Promise<TaskExecution[]>;

  recordAnalytics(analytics: Omit<Analytics, 'id'>): Promise<Analytics>;
  getAnalytics(userId: string, platformId: string, startDate: Date, endDate: Date): Promise<Analytics[]>;

  seedDemoData(): Promise<User>;
}

class InMemoryDB implements DatabaseAdapter {
  private users: Map<string, User> = new Map();
  private accounts: Map<string, PlatformAccount> = new Map();
  private tasks: Map<string, Task> = new Map();
  private executions: Map<string, TaskExecution> = new Map();
  private analytics: Map<string, Analytics> = new Map();

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const newUser: User = {
      ...user,
      id: user.id ?? crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async createAccount(
    account: Omit<PlatformAccount, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PlatformAccount> {
    const newAccount: PlatformAccount = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.set(newAccount.id, newAccount);
    return newAccount;
  }

  async getAccount(id: string): Promise<PlatformAccount | undefined> {
    return this.accounts.get(id);
  }

  async getUserAccounts(userId: string): Promise<PlatformAccount[]> {
    return Array.from(this.accounts.values()).filter(a => a.userId === userId);
  }

  async getPlatformAccounts(userId: string, platformId: string): Promise<PlatformAccount[]> {
    return Array.from(this.accounts.values()).filter(
      a => a.userId === userId && a.platformId === platformId
    );
  }

  async updateAccount(id: string, updates: Partial<PlatformAccount>): Promise<PlatformAccount | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    const updated = { ...account, ...updates, updatedAt: new Date() };
    this.accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    return this.accounts.delete(id);
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'lastExecuted'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.userId === userId);
  }

  async getActiveTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status === 'active');
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async createExecution(execution: Omit<TaskExecution, 'id'>): Promise<TaskExecution> {
    const newExecution: TaskExecution = {
      ...execution,
      id: crypto.randomUUID(),
    };
    this.executions.set(newExecution.id, newExecution);
    return newExecution;
  }

  async getTaskExecutions(taskId: string): Promise<TaskExecution[]> {
    return Array.from(this.executions.values()).filter(e => e.taskId === taskId);
  }

  async getExecutionsByDate(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TaskExecution[]> {
    return Array.from(this.executions.values()).filter(e => {
      const task = this.tasks.get(e.taskId);
      return (
        task?.userId === userId &&
        e.executedAt >= startDate &&
        e.executedAt <= endDate
      );
    });
  }

  async recordAnalytics(analytics: Omit<Analytics, 'id'>): Promise<Analytics> {
    const newAnalytics: Analytics = {
      ...analytics,
      id: crypto.randomUUID(),
    };
    this.analytics.set(newAnalytics.id, newAnalytics);
    return newAnalytics;
  }

  async getAnalytics(
    userId: string,
    platformId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Analytics[]> {
    return Array.from(this.analytics.values()).filter(
      a => a.userId === userId && a.platformId === platformId &&
      a.date >= startDate && a.date <= endDate
    );
  }

  async seedDemoData(): Promise<User> {
    const demoUser = await this.createUser({
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
    });

    await this.createAccount({
      userId: demoUser.id,
      platformId: 'facebook',
      accountName: 'My Facebook Page',
      accountUsername: 'demo_page',
      accountId: 'fb_123456',
      accessToken: 'fb_token_demo',
      isActive: true,
    });

    await this.createAccount({
      userId: demoUser.id,
      platformId: 'twitter',
      accountName: 'My Twitter Account',
      accountUsername: '@demo_user',
      accountId: 'tw_123456',
      accessToken: 'tw_token_demo',
      isActive: true,
    });

    return demoUser;
  }
}

class PostgresDB implements DatabaseAdapter {
  private pool: import('pg').Pool;
  private schemaReady = false;

  constructor(connectionString: string) {
    const PoolConstructor = getPgPoolConstructor();
    this.pool = new PoolConstructor({ connectionString });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        platform_id TEXT NOT NULL,
        account_name TEXT NOT NULL,
        account_username TEXT NOT NULL,
        account_id TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        credentials JSONB,
        is_active BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        source_accounts TEXT[] NOT NULL,
        target_accounts TEXT[] NOT NULL,
        content_type TEXT NOT NULL,
        status TEXT NOT NULL,
        execution_type TEXT NOT NULL,
        schedule_time TIMESTAMPTZ,
        recurring_pattern TEXT,
        recurring_days INT[],
        filters JSONB,
        transformations JSONB,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        last_executed TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        source_account TEXT NOT NULL,
        target_account TEXT NOT NULL,
        original_content TEXT NOT NULL,
        transformed_content TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        executed_at TIMESTAMPTZ NOT NULL,
        response_data JSONB
      );
      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        platform_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        posts INT NOT NULL,
        engagements INT NOT NULL,
        clicks INT NOT NULL,
        reach INT NOT NULL,
        impressions INT NOT NULL
      );
    `);
    this.schemaReady = true;
  }

  private mapUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapAccount(row: any): PlatformAccount {
    return {
      id: row.id,
      userId: row.user_id,
      platformId: row.platform_id,
      accountName: row.account_name,
      accountUsername: row.account_username,
      accountId: row.account_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token ?? undefined,
      credentials: row.credentials ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapTask(row: any): Task {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      sourceAccounts: row.source_accounts ?? [],
      targetAccounts: row.target_accounts ?? [],
      contentType: row.content_type,
      status: row.status,
      executionType: row.execution_type,
      scheduleTime: row.schedule_time ? new Date(row.schedule_time) : undefined,
      recurringPattern: row.recurring_pattern ?? undefined,
      recurringDays: row.recurring_days ?? undefined,
      filters: row.filters ?? undefined,
      transformations: row.transformations ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastExecuted: row.last_executed ? new Date(row.last_executed) : undefined,
    };
  }

  private mapExecution(row: any): TaskExecution {
    return {
      id: row.id,
      taskId: row.task_id,
      sourceAccount: row.source_account,
      targetAccount: row.target_account,
      originalContent: row.original_content,
      transformedContent: row.transformed_content,
      status: row.status,
      error: row.error ?? undefined,
      executedAt: new Date(row.executed_at),
      responseData: row.response_data ?? undefined,
    };
  }

  private mapAnalytics(row: any): Analytics {
    return {
      id: row.id,
      userId: row.user_id,
      date: new Date(row.date),
      platformId: row.platform_id,
      accountId: row.account_id,
      posts: row.posts,
      engagements: row.engagements,
      clicks: row.clicks,
      reach: row.reach,
      impressions: row.impressions,
    };
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    await this.ensureSchema();
    const id = user.id ?? crypto.randomUUID();
    const now = new Date();
    await this.pool.query(
      `INSERT INTO users (id, email, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)` ,
      [id, user.email, user.name, now, now]
    );
    return { id, email: user.email, name: user.name, createdAt: now, updatedAt: now };
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return this.mapUser(result.rows[0]);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return undefined;
    return this.mapUser(result.rows[0]);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await this.ensureSchema();
    const existing = await this.getUser(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    await this.pool.query(
      `UPDATE users SET email = $1, name = $2, updated_at = $3 WHERE id = $4`,
      [updated.email, updated.name, updated.updatedAt, id]
    );
    return updated;
  }

  async createAccount(
    account: Omit<PlatformAccount, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PlatformAccount> {
    await this.ensureSchema();
    const id = crypto.randomUUID();
    const now = new Date();
    await this.pool.query(
      `INSERT INTO accounts (
        id, user_id, platform_id, account_name, account_username, account_id,
        access_token, refresh_token, credentials, is_active, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)` ,
      [
        id,
        account.userId,
        account.platformId,
        account.accountName,
        account.accountUsername,
        account.accountId,
        account.accessToken,
        account.refreshToken ?? null,
        account.credentials ?? null,
        account.isActive,
        now,
        now,
      ]
    );
    return { ...account, id, createdAt: now, updatedAt: now };
  }

  async getAccount(id: string): Promise<PlatformAccount | undefined> {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return this.mapAccount(result.rows[0]);
  }

  async getUserAccounts(userId: string): Promise<PlatformAccount[]> {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    return result.rows.map(row => this.mapAccount(row));
  }

  async getPlatformAccounts(userId: string, platformId: string): Promise<PlatformAccount[]> {
    await this.ensureSchema();
    const result = await this.pool.query(
      'SELECT * FROM accounts WHERE user_id = $1 AND platform_id = $2',
      [userId, platformId]
    );
    return result.rows.map(row => this.mapAccount(row));
  }

  async updateAccount(id: string, updates: Partial<PlatformAccount>): Promise<PlatformAccount | undefined> {
    await this.ensureSchema();
    const existing = await this.getAccount(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    await this.pool.query(
      `UPDATE accounts SET
        platform_id = $1,
        account_name = $2,
        account_username = $3,
        account_id = $4,
        access_token = $5,
        refresh_token = $6,
        credentials = $7,
        is_active = $8,
        updated_at = $9
      WHERE id = $10`,
      [
        updated.platformId,
        updated.accountName,
        updated.accountUsername,
        updated.accountId,
        updated.accessToken,
        updated.refreshToken ?? null,
        updated.credentials ?? null,
        updated.isActive,
        updated.updatedAt,
        id,
      ]
    );
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.pool.query('DELETE FROM accounts WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'lastExecuted'>): Promise<Task> {
    await this.ensureSchema();
    const id = crypto.randomUUID();
    const now = new Date();
    await this.pool.query(
      `INSERT INTO tasks (
        id, user_id, name, description, source_accounts, target_accounts, content_type, status,
        execution_type, schedule_time, recurring_pattern, recurring_days, filters, transformations,
        created_at, updated_at, last_executed
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)` ,
      [
        id,
        task.userId,
        task.name,
        task.description,
        task.sourceAccounts,
        task.targetAccounts,
        task.contentType,
        task.status,
        task.executionType,
        task.scheduleTime ?? null,
        task.recurringPattern ?? null,
        task.recurringDays ?? null,
        task.filters ?? null,
        task.transformations ?? null,
        now,
        now,
        null,
      ]
    );
    return { ...task, id, createdAt: now, updatedAt: now };
  }

  async getTask(id: string): Promise<Task | undefined> {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return this.mapTask(result.rows[0]);
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
    return result.rows.map(row => this.mapTask(row));
  }

  async getActiveTasks(): Promise<Task[]> {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM tasks WHERE status = $1', ['active']);
    return result.rows.map(row => this.mapTask(row));
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    await this.ensureSchema();
    const existing = await this.getTask(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    await this.pool.query(
      `UPDATE tasks SET
        name = $1,
        description = $2,
        source_accounts = $3,
        target_accounts = $4,
        content_type = $5,
        status = $6,
        execution_type = $7,
        schedule_time = $8,
        recurring_pattern = $9,
        recurring_days = $10,
        filters = $11,
        transformations = $12,
        updated_at = $13,
        last_executed = $14
      WHERE id = $15`,
      [
        updated.name,
        updated.description,
        updated.sourceAccounts,
        updated.targetAccounts,
        updated.contentType,
        updated.status,
        updated.executionType,
        updated.scheduleTime ?? null,
        updated.recurringPattern ?? null,
        updated.recurringDays ?? null,
        updated.filters ?? null,
        updated.transformations ?? null,
        updated.updatedAt,
        updated.lastExecuted ?? null,
        id,
      ]
    );
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async createExecution(execution: Omit<TaskExecution, 'id'>): Promise<TaskExecution> {
    await this.ensureSchema();
    const id = crypto.randomUUID();
    await this.pool.query(
      `INSERT INTO executions (
        id, task_id, source_account, target_account, original_content, transformed_content,
        status, error, executed_at, response_data
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)` ,
      [
        id,
        execution.taskId,
        execution.sourceAccount,
        execution.targetAccount,
        execution.originalContent,
        execution.transformedContent,
        execution.status,
        execution.error ?? null,
        execution.executedAt,
        execution.responseData ?? null,
      ]
    );
    return { ...execution, id };
  }

  async getTaskExecutions(taskId: string): Promise<TaskExecution[]> {
    await this.ensureSchema();
    const result = await this.pool.query(
      'SELECT * FROM executions WHERE task_id = $1 ORDER BY executed_at DESC',
      [taskId]
    );
    return result.rows.map(row => this.mapExecution(row));
  }

  async getExecutionsByDate(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TaskExecution[]> {
    await this.ensureSchema();
    const result = await this.pool.query(
      `SELECT e.* FROM executions e
       JOIN tasks t ON e.task_id = t.id
       WHERE t.user_id = $1 AND e.executed_at >= $2 AND e.executed_at <= $3
       ORDER BY e.executed_at DESC`,
      [userId, startDate, endDate]
    );
    return result.rows.map(row => this.mapExecution(row));
  }

  async recordAnalytics(analytics: Omit<Analytics, 'id'>): Promise<Analytics> {
    await this.ensureSchema();
    const id = crypto.randomUUID();
    await this.pool.query(
      `INSERT INTO analytics (
        id, user_id, date, platform_id, account_id, posts, engagements, clicks, reach, impressions
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)` ,
      [
        id,
        analytics.userId,
        analytics.date,
        analytics.platformId,
        analytics.accountId,
        analytics.posts,
        analytics.engagements,
        analytics.clicks,
        analytics.reach,
        analytics.impressions,
      ]
    );
    return { ...analytics, id };
  }

  async getAnalytics(
    userId: string,
    platformId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Analytics[]> {
    await this.ensureSchema();
    const result = await this.pool.query(
      `SELECT * FROM analytics
       WHERE user_id = $1 AND platform_id = $2 AND date >= $3 AND date <= $4
       ORDER BY date DESC`,
      [userId, platformId, startDate, endDate]
    );
    return result.rows.map(row => this.mapAnalytics(row));
  }

  async seedDemoData(): Promise<User> {
    await this.ensureSchema();
    const existing = await this.getUser('demo-user');
    if (existing) return existing;
    const demoUser = await this.createUser({
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
    });

    await this.createAccount({
      userId: demoUser.id,
      platformId: 'facebook',
      accountName: 'My Facebook Page',
      accountUsername: 'demo_page',
      accountId: 'fb_123456',
      accessToken: 'fb_token_demo',
      isActive: true,
    });

    await this.createAccount({
      userId: demoUser.id,
      platformId: 'twitter',
      accountName: 'My Twitter Account',
      accountUsername: '@demo_user',
      accountId: 'tw_123456',
      accessToken: 'tw_token_demo',
      isActive: true,
    });

    return demoUser;
  }
}

const getAdapter = (): DatabaseAdapter => {
  if (typeof window !== 'undefined') {
    const memory = new InMemoryDB();
    void memory.seedDemoData();
    return memory;
  }

  if (process.env.DATABASE_URL) {
    return new PostgresDB(process.env.DATABASE_URL);
  }

  const memory = new InMemoryDB();
  void memory.seedDemoData();
  return memory;
};

export const db = getAdapter();

export async function ensureUserExists(userId: string): Promise<User> {
  let user = await db.getUser(userId);
  if (!user) {
    user = await db.createUser({
      id: userId,
      email: `user-${userId}@socialflow.app`,
      name: 'User',
    });
  }
  return user;
}

export async function getOrCreateAccount(
  userId: string,
  platformId: string,
  accountId: string,
  username: string
): Promise<PlatformAccount> {
  const accounts = await db.getUserAccounts(userId);
  const existing = accounts.find(a => a.platformId === platformId && a.accountId === accountId);

  if (existing) return existing;

  return db.createAccount({
    userId,
    platformId,
    accountId,
    accountUsername: username,
    accountName: username,
    accessToken: 'manual-token',
    isActive: true,
  });
}
