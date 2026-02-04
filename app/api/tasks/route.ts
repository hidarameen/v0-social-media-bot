import { NextRequest, NextResponse } from 'next/server';
import { db, ensureUserExists } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getUserId } from '@/lib/api/request';
import { taskCreateSchema } from '@/lib/api/validation';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const user = await ensureUserExists(userId);
    const tasks = await db.getUserTasks(user.id);
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    logger.error('[API] Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const raw = await request.json();
    const parsed = taskCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid task payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const user = await ensureUserExists(userId);
    const task = await db.createTask({
      userId: user.id,
      name: body.name,
      description: body.description ?? '',
      sourceAccounts: body.sourceAccounts,
      targetAccounts: body.targetAccounts,
      contentType: body.contentType ?? 'text',
      status: body.status ?? 'active',
      executionType: body.executionType ?? 'immediate',
      scheduleTime: body.scheduleTime ? new Date(body.scheduleTime) : undefined,
      recurringPattern: body.recurringPattern,
      recurringDays: body.recurringDays,
      filters: body.filters,
      transformations: body.transformations,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    logger.error('[API] Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
