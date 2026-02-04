import { db, ensureUserExists, type Task, type PlatformAccount, type TaskExecution } from '@/lib/db';
import { getPlatformHandler } from '@/lib/platforms/handlers';
import type { PlatformId } from '@/lib/platforms/types';

export class TaskProcessor {
  /**
   * معالج المهام الشامل - ينقل المحتوى من مصدر إلى هدف واحد أو أكثر
   */
  async processTask(taskId: string): Promise<TaskExecution[]> {
    const task = await db.getTask(taskId);
    if (!task) throw new Error('Task not found');

    const executions: TaskExecution[] = [];

    // الحصول على حسابات المصدر والهدف
    const sourceAccounts = (
      await Promise.all(task.sourceAccounts.map(id => db.getAccount(id)))
    ).filter(Boolean) as PlatformAccount[];

    const targetAccounts = (
      await Promise.all(task.targetAccounts.map(id => db.getAccount(id)))
    ).filter(Boolean) as PlatformAccount[];

    if (sourceAccounts.length === 0 || targetAccounts.length === 0) {
      throw new Error('Source or target accounts not found');
    }

    // معالجة كل زوج من (مصدر -> هدف)
    for (const sourceAccount of sourceAccounts) {
      for (const targetAccount of targetAccounts) {
        try {
          const execution = await this.executeTransfer(
            task,
            sourceAccount,
            targetAccount
          );
          executions.push(execution);
        } catch (error) {
          const execution = await db.createExecution({
            taskId,
            sourceAccount: sourceAccount.id,
            targetAccount: targetAccount.id,
            originalContent: task.description,
            transformedContent: '',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            executedAt: new Date(),
          });
          executions.push(execution);
        }
      }
    }

    // تحديث آخر تنفيذ للمهمة
    await db.updateTask(taskId, { lastExecuted: new Date() });

    return executions;
  }

  /**
   * نقل محتوى من حساب مصدر إلى حساب هدف
   */
  private async executeTransfer(
    task: Task,
    sourceAccount: PlatformAccount,
    targetAccount: PlatformAccount
  ): Promise<TaskExecution> {
    // الحصول على معالجات المنصات
    const sourceHandler = getPlatformHandler(sourceAccount.platformId as PlatformId);
    const targetHandler = getPlatformHandler(targetAccount.platformId as PlatformId);

    // تحويل المحتوى
    let transformedContent = task.description;

    if (task.transformations) {
      transformedContent = this.applyTransformations(
        transformedContent,
        task.transformations
      );
    }

    // إرسال إلى المنصة الهدف
    const postRequest = {
      content: transformedContent,
      scheduleTime: task.scheduleTime,
      hashtags: task.transformations?.addHashtags,
    };

    let postResponse;
    if (task.executionType === 'scheduled' && task.scheduleTime) {
      postResponse = await targetHandler.schedulePost(
        postRequest,
        targetAccount.accessToken
      );
    } else {
      postResponse = await targetHandler.publishPost(
        postRequest,
        targetAccount.accessToken
      );
    }

    if (!postResponse.success) {
      throw new Error(postResponse.error || 'Failed to publish');
    }

    // تسجيل التنفيذ
    return db.createExecution({
      taskId: task.id,
      sourceAccount: sourceAccount.id,
      targetAccount: targetAccount.id,
      originalContent: task.description,
      transformedContent,
      status: 'success',
      executedAt: new Date(),
      responseData: {
        postId: postResponse.postId,
        url: postResponse.url,
      },
    });
  }

  /**
   * تطبيق التحويلات على المحتوى
   */
  private applyTransformations(
    content: string,
    transformations: Task['transformations']
  ): string {
    let result = content;

    if (transformations?.prependText) {
      result = `${transformations.prependText}\n${result}`;
    }

    if (transformations?.appendText) {
      result = `${result}\n${transformations.appendText}`;
    }

    if (transformations?.addHashtags && transformations.addHashtags.length > 0) {
      result = `${result}\n\n${transformations.addHashtags.join(' ')}`;
    }

    return result;
  }

  /**
   * معالجة مهام متكررة
   */
  async processRecurringTasks(): Promise<void> {
    // هذا سيتم تشغيله بواسطة cron job في الإنتاج
    const user = await ensureUserExists('demo-user');
    const tasks = await db.getUserTasks(user.id);
    for (const task of tasks) {
      if (task.status !== 'active' || task.executionType !== 'recurring') continue;

      const shouldExecute = this.shouldExecuteRecurring(task);
      if (shouldExecute) {
        await this.processTask(task.id);
      }
    }
  }

  /**
   * التحقق من ما إذا كان يجب تنفيذ المهمة المتكررة
   */
  private shouldExecuteRecurring(task: Task): boolean {
    if (!task.lastExecuted) return true;

    const now = new Date();
    const lastExec = new Date(task.lastExecuted);

    switch (task.recurringPattern) {
      case 'daily':
        return (now.getTime() - lastExec.getTime()) >= 24 * 60 * 60 * 1000;
      case 'weekly':
        return (now.getTime() - lastExec.getTime()) >= 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return (now.getTime() - lastExec.getTime()) >= 30 * 24 * 60 * 60 * 1000;
      default:
        return false;
    }
  }

  /**
   * تصفية المحتوى بناءً على الفلاتر
   */
  applyFilters(content: string, filters?: Task['filters']): boolean {
    if (!filters) return true;

    // فلتر الكلمات الرئيسية
    if (filters.keywords && filters.keywords.length > 0) {
      const hasKeyword = filters.keywords.some(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // فلتر الكلمات المستبعدة
    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      const hasExcluded = filters.excludeKeywords.some(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    return true;
  }

  /**
   * الحصول على إحصائيات التنفيذ
   */
  async getExecutionStats(taskId: string) {
    const executions = await db.getTaskExecutions(taskId);
    
    // التحقق من أن executions هو مصفوفة
    if (!Array.isArray(executions)) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        lastExecuted: undefined,
      };
    }

    const successfulExecutions = executions.filter(e => e.status === 'success');
    const failedExecutions = executions.filter(e => e.status === 'failed');

    return {
      total: executions.length,
      successful: successfulExecutions.length,
      failed: failedExecutions.length,
      successRate:
        executions.length > 0
          ? (
              (successfulExecutions.length / executions.length) *
              100
            ).toFixed(2)
          : '0',
      lastExecuted:
        executions.length > 0
          ? executions.sort(
              (a, b) =>
                new Date(b.executedAt).getTime() -
                new Date(a.executedAt).getTime()
            )[0]?.executedAt
          : undefined,
    };
  }
}

export const taskProcessor = new TaskProcessor();
