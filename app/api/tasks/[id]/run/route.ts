import { NextRequest, NextResponse } from 'next/server';
import { taskProcessor } from '@/lib/services/task-processor';
import { logger } from '@/lib/logger';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const executions = await taskProcessor.processTask(id);
    return NextResponse.json({ success: true, executions });
  } catch (error) {
    logger.error('[API] Error running task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run task' },
      { status: 500 }
    );
  }
}
