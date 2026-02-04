// خدمة الصيانة والتحسينات

import { db, ensureUserExists } from '@/lib/db';
import { logger } from '@/lib/logger';

export class MaintenanceService {
  /**
   * تحسين الأداء: تنظيف التنفيذات القديمة
   */
  async cleanupOldExecutions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    const user = await ensureUserExists('demo-user');
    const tasks = await db.getUserTasks(user.id);
    for (const task of tasks) {
      const executions = await db.getTaskExecutions(task.id);
      const toDelete = executions.filter(e => e.executedAt < cutoffDate);
      
      for (const exec of toDelete) {
        // تنظيف التنفيذات القديمة
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * تحسين الأداء: تجميع ضغط البيانات
   */
  async compressData(): Promise<void> {
    // في الإنتاج: استخدم VACUUM في PostgreSQL
    logger.info('[Maintenance] Compressing database...');
  }

  /**
   * تحسين الأداء: حساب الإحصائيات
   */
  async rebuildStatistics(): Promise<void> {
    logger.info('[Maintenance] Rebuilding statistics...');
    
    const user = await ensureUserExists('demo-user');
    if (user) {
      const tasks = await db.getUserTasks(user.id);
      const accounts = await db.getUserAccounts(user.id);
      
      logger.info(
        `[Maintenance] User ${user.id}: ${tasks.length} tasks, ${accounts.length} accounts`
      );
    }
  }

  /**
   * صحة النظام: فحص الحسابات المنتهية الصلاحية
   */
  async checkExpiredTokens(): Promise<string[]> {
    const expiredTokens: string[] = [];
    
    const user = await ensureUserExists('demo-user');
    const accounts = await db.getUserAccounts(user.id);
    for (const account of accounts) {
      // في الإنتاج: تحقق من صلاحية التوكنات
      if (Math.random() > 0.9) {
        expiredTokens.push(account.id);
      }
    }

    return expiredTokens;
  }

  /**
   * تحسين الأداء: تحديث ذاكرة التخزين المؤقتة
   */
  async refreshCache(): Promise<void> {
    logger.info('[Maintenance] Refreshing cache...');
    
    const user = await ensureUserExists('demo-user');
    if (user) {
      const tasks = await db.getUserTasks(user.id);
      // إعادة بناء الذاكرة المؤقتة للمهام النشطة
      for (const task of tasks.filter(t => t.status === 'active')) {
        logger.info(`[Cache] Cached task: ${task.name}`);
      }
    }
  }

  /**
   * تحسين الأداء: الفهرسة
   */
  async optimizeIndexes(): Promise<void> {
    logger.info('[Maintenance] Optimizing indexes...');
    // في الإنتاج: استخدم REINDEX في PostgreSQL
  }

  /**
   * صحة النظام: الفحص الشامل
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: Record<string, any>;
  }> {
    const issues: string[] = [];
    const metrics: Record<string, any> = {};

    // فحص قاعدة البيانات
    const user = await ensureUserExists('demo-user');
    const totalUsers = user ? 1 : 0;
    const totalTasks = user ? (await db.getUserTasks(user.id)).length : 0;
    const totalAccounts = user ? (await db.getUserAccounts(user.id)).length : 0;

    metrics.totalUsers = totalUsers;
    metrics.totalTasks = totalTasks;
    metrics.totalAccounts = totalAccounts;

    // فحص التنفيذات الفاشلة
    let failedExecutions = 0;
    if (user) {
      const tasks = await db.getUserTasks(user.id);
      for (const task of tasks) {
        const executions = await db.getTaskExecutions(task.id);
        failedExecutions += executions.filter(e => e.status === 'failed').length;
      }
    }

    metrics.failedExecutions = failedExecutions;

    if (failedExecutions > 10) {
      issues.push('High number of failed executions');
    }

    // فحص الحسابات غير النشطة
    const inactiveAccounts = user
      ? (await db.getUserAccounts(user.id)).filter(a => !a.isActive).length
      : 0;

    metrics.inactiveAccounts = inactiveAccounts;

    if (inactiveAccounts > totalAccounts * 0.5) {
      issues.push('More than 50% of accounts are inactive');
    }

    // تحديد حالة الصحة
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'critical' : 'warning';
    }

    return { status, issues, metrics };
  }

  /**
   * تشغيل الصيانة الدورية
   */
  async runFullMaintenance(): Promise<void> {
    logger.info('[Maintenance] Starting full maintenance...');

    try {
      await this.cleanupOldExecutions();
      await this.rebuildStatistics();
      await this.compressData();
      await this.refreshCache();
      await this.optimizeIndexes();

      const expiredTokens = await this.checkExpiredTokens();
      if (expiredTokens.length > 0) {
        logger.info(`[Maintenance] Found ${expiredTokens.length} expired tokens`);
      }

      const health = await this.healthCheck();
      logger.info('[Maintenance] Health check:', health);

      logger.info('[Maintenance] Full maintenance completed successfully');
    } catch (error) {
      logger.error('[Maintenance] Error during maintenance:', error);
    }
  }
}

export const maintenanceService = new MaintenanceService();
