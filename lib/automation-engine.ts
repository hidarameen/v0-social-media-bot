import {
  ContentItem,
  ExecutionError,
  TaskExecution,
  PlatformAccount,
  SocialPlatform,
} from './types'
import { db, type Task, type PlatformAccount as DbAccount } from './db'
import { platformManager } from './platform-manager'

/**
 * Automation Engine - Handles task execution, scheduling, and content transformation
 */
export class AutomationEngine {
  /**
   * Execute a single automation task
   */
  async executeTask(task: Task, accounts: Map<string, PlatformAccount>): Promise<TaskExecution> {
    const startTime = Date.now()
    const errors: ExecutionError[] = []
    let itemsProcessed = 0
    let itemsFailed = 0

    try {
      const sourceAccounts = task.sourceAccounts
        .map(id => accounts.get(id))
        .filter((a): a is PlatformAccount => a !== undefined)

      if (sourceAccounts.length === 0) {
        throw new Error('No valid source accounts found')
      }

      const destAccounts = task.targetAccounts
        .map(id => accounts.get(id))
        .filter((a): a is PlatformAccount => a !== undefined)

      if (destAccounts.length === 0) {
        throw new Error('No valid destination accounts found')
      }

      for (const account of [...sourceAccounts, ...destAccounts]) {
        try {
          await platformManager.initializeClient(account)
        } catch (error) {
          errors.push({
            platform: account.platform,
            accountId: account.id,
            code: 'CLIENT_INIT_ERROR',
            message: `Failed to initialize client: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
            retryable: true,
          })
        }
      }

      itemsProcessed = 1

      const contentToDistribute: ContentItem = {
        type: task.contentType,
        text: task.description,
      }

      const results = await platformManager.distributeContent(
        destAccounts,
        contentToDistribute,
        (text, platform) => this.transformContent(text, platform, task)
      )

      for (const result of results) {
        if (!result.result.success) {
          itemsFailed++
          errors.push({
            platform: result.platform,
            accountId: result.accountId,
            code: 'PUBLISH_ERROR',
            message: result.result.error || 'Unknown error',
            timestamp: new Date(),
            retryable: true,
          })
        }
      }

      await db.updateTask(task.id, { lastExecuted: new Date() })
    } catch (error) {
      itemsFailed++
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push({
        platform: 'unknown',
        accountId: '',
        code: 'EXECUTION_ERROR',
        message,
        timestamp: new Date(),
        retryable: true,
      })
    }

    const duration = Date.now() - startTime

    return {
      id: crypto.randomUUID(),
      taskId: task.id,
      status: itemsFailed === 0 ? 'success' : itemsFailed === itemsProcessed ? 'failed' : 'partial',
      startedAt: new Date(Date.now() - duration),
      completedAt: new Date(),
      duration,
      itemsProcessed,
      itemsFailed,
      errors,
    }
  }

  /**
   * Transform content for different platforms
   */
  private transformContent(text: string, platform: SocialPlatform, task: Task): string {
    let transformed = text

    if (task.transformations?.prependText) {
      transformed = `${task.transformations.prependText}\n${transformed}`
    }

    if (task.transformations?.appendText) {
      transformed = `${transformed}\n${task.transformations.appendText}`
    }

    if (task.transformations?.addHashtags?.length) {
      transformed += `\n\n${task.transformations.addHashtags.join(' ')}`
    }

    const maxLength = this.getPlatformMaxLength(platform)
    if (transformed.length > maxLength) {
      transformed = transformed.substring(0, maxLength - 3) + '...'
    }

    return transformed
  }

  /**
   * Get character limit for platform
   */
  private getPlatformMaxLength(platform: SocialPlatform): number {
    switch (platform) {
      case 'twitter':
        return 280
      case 'tiktok':
        return 2200
      case 'instagram':
        return 2200
      case 'facebook':
        return 63206
      case 'youtube':
        return 5000
      case 'telegram':
        return 4096
      case 'linkedin':
        return 3000
      case 'threads':
        return 500
      default:
        return 10000
    }
  }

  /**
   * Schedule a task to run at specific times
   */
  scheduleTask(task: Task): Date | null {
    if (task.executionType === 'scheduled' && task.scheduleTime) {
      return task.scheduleTime
    }

    if (task.executionType !== 'recurring') return null

    const nextRun = new Date()

    switch (task.recurringPattern) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1)
        break
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7)
        break
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1)
        break
      default:
        return null
    }

    return nextRun
  }

  /**
   * Get tasks that are due to run
   */
  async getTasksDueForExecution(): Promise<Task[]> {
    const allTasks = await db.getActiveTasks()
    const now = new Date()

    return allTasks.filter(task => {
      if (task.executionType === 'scheduled' && task.scheduleTime) {
        return task.scheduleTime <= now
      }

      if (task.executionType === 'recurring' && task.recurringPattern) {
        if (!task.lastExecuted) return true
        const last = task.lastExecuted
        const diff = now.getTime() - last.getTime()
        switch (task.recurringPattern) {
          case 'daily':
            return diff >= 24 * 60 * 60 * 1000
          case 'weekly':
            return diff >= 7 * 24 * 60 * 60 * 1000
          case 'monthly':
            return diff >= 30 * 24 * 60 * 60 * 1000
          default:
            return false
        }
      }

      return task.executionType === 'immediate'
    })
  }

  /**
   * Process execution with retry logic
   */
  async executeWithRetry(
    task: Task,
    accounts: Map<string, PlatformAccount>,
    maxRetries = 3
  ): Promise<TaskExecution> {
    let lastError: TaskExecution | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const execution = await this.executeTask(task, accounts)

        if (execution.status === 'success' || execution.status === 'partial') {
          return execution
        }

        lastError = execution

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        lastError = {
          id: crypto.randomUUID(),
          taskId: task.id,
          status: 'failed',
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 0,
          itemsProcessed: 0,
          itemsFailed: 1,
          errors: [
            {
              platform: 'unknown',
              accountId: '',
              code: 'EXECUTION_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
              retryable: true,
            },
          ],
        }
      }
    }

    return (
      lastError || {
        id: crypto.randomUUID(),
        taskId: task.id,
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 0,
        itemsProcessed: 0,
        itemsFailed: 1,
        errors: [
          {
            platform: 'unknown',
            accountId: '',
            code: 'UNKNOWN_ERROR',
            message: 'Max retries reached',
            timestamp: new Date(),
            retryable: false,
          },
        ],
      }
    )
  }

  async buildAccountMap(userId: string): Promise<Map<string, PlatformAccount>> {
    const map = new Map<string, PlatformAccount>()
    const accounts = await db.getUserAccounts(userId)
    for (const account of accounts) {
      map.set(account.id, this.toPlatformAccount(account))
    }
    return map
  }

  private toPlatformAccount(account: DbAccount): PlatformAccount {
    return {
      id: account.id,
      userId: account.userId,
      platform: account.platformId as SocialPlatform,
      accountId: account.accountId,
      username: account.accountUsername,
      displayName: account.accountName,
      authType: 'manual',
      isActive: account.isActive,
      credentials: {
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        customData: account.credentials,
      },
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }
  }
}

export const automationEngine = new AutomationEngine()
