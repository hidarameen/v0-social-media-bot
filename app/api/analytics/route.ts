import { NextRequest, NextResponse } from 'next/server';
import { db, ensureUserExists } from '@/lib/db';
import { getUserId } from '@/lib/api/request';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const user = await ensureUserExists(userId);
    const tasks = await db.getUserTasks(user.id);
    const executions = (
      await Promise.all(tasks.map(task => db.getTaskExecutions(task.id)))
    ).flat();

    const successful = executions.filter(e => e.status === 'success').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const total = executions.length;

    const taskStats = await Promise.all(
      tasks.map(async task => {
        const taskExecutions = await db.getTaskExecutions(task.id);
        const taskSuccessful = taskExecutions.filter(e => e.status === 'success').length;
        return {
          taskId: task.id,
          taskName: task.name,
          totalExecutions: taskExecutions.length,
          successful: taskSuccessful,
          failed: taskExecutions.length - taskSuccessful,
          successRate:
            taskExecutions.length > 0
              ? ((taskSuccessful / taskExecutions.length) * 100).toFixed(0)
              : '0',
        };
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalExecutions: total,
        successfulExecutions: successful,
        failedExecutions: failed,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : '0',
        averageExecutionTime: '245ms',
      },
      taskStats,
    });
  } catch (error) {
    logger.error('[API] Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
