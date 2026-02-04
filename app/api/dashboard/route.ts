import { NextRequest, NextResponse } from 'next/server';
import { db, ensureUserExists } from '@/lib/db';
import { getUserId } from '@/lib/api/request';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const user = await ensureUserExists(userId);
    const userTasks = await db.getUserTasks(user.id);
    const userAccounts = await db.getUserAccounts(user.id);
    const activeTasks = userTasks.filter(task => task.status === 'active');

    const allExecutions = (
      await Promise.all(userTasks.map(task => db.getTaskExecutions(task.id)))
    ).flat();

    const recentTasks = [...userTasks]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    const recentExecutions = [...allExecutions]
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        totalTasks: userTasks.length,
        totalAccounts: userAccounts.length,
        activeTasksCount: activeTasks.length,
        totalExecutions: allExecutions.length,
      },
      recentTasks,
      recentExecutions,
    });
  } catch (error) {
    logger.error('[API] Error loading dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
