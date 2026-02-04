import { NextRequest, NextResponse } from 'next/server'
import { db, ensureUserExists, getOrCreateAccount } from '@/lib/db'
import { getUserId } from '@/lib/api/request'
import { accountCreateSchema } from '@/lib/api/validation'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    
    // Ensure user exists
    await ensureUserExists(userId)
    
    // Get all accounts for this user
    const accounts = await db.getUserAccounts(userId)
    
    return NextResponse.json({ success: true, accounts })
  } catch (error) {
    logger.error('[API] Error fetching accounts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const raw = await request.json()
    const parsed = accountCreateSchema.safeParse({
      platformId: raw.platformId ?? raw.platform,
      accountId: raw.accountId,
      accountUsername: raw.accountUsername ?? raw.username,
      accountName: raw.accountName ?? raw.displayName ?? raw.username,
      accessToken: raw.accessToken,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid account payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { platformId, accountId, accountUsername, accountName, accessToken } = parsed.data

    // Ensure user exists
    await ensureUserExists(userId)
    
    // Create account
    const account = await getOrCreateAccount(userId, platformId, accountId, accountUsername)

    await db.updateAccount(account.id, {
      accessToken,
      accountName,
      accountUsername,
    })

    const refreshed = await db.getAccount(account.id)
    return NextResponse.json({ success: true, account: refreshed ?? account }, { status: 201 })
  } catch (error) {
    logger.error('[API] Error creating account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
