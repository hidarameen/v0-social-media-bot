import { NextRequest, NextResponse } from 'next/server';
import { ensureUserExists } from '@/lib/db';
import { getUserId } from '@/lib/api/request';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const user = await ensureUserExists(userId);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    logger.error('[API] Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
