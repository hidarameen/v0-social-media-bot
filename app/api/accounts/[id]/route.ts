import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountUpdateSchema } from '@/lib/api/validation';
import { logger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const raw = await request.json();
    const parsed = accountUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid account payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const updated = await db.updateAccount(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, account: updated });
  } catch (error) {
    logger.error('[API] Error updating account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = await db.deleteAccount(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[API] Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
