import { NextRequest, NextResponse } from 'next/server';
import { db, ensureUserExists } from '@/lib/db';
import { getUserId } from '@/lib/api/request';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const user = await ensureUserExists(userId);
    const tasks = await db.getUserTasks(user.id);
    const executionGroups = await Promise.all(
      tasks.map(async task => {
        const taskExecutions = await db.getTaskExecutions(task.id);
        return taskExecutions.map(execution => ({
          ...execution,
          taskName: task.name,
        }));
      })
    );

    const executions = executionGroups.flat().sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
    return NextResponse.json({ success: true, executions });
  } catch (error) {
    logger.error('[API] Error fetching executions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}
