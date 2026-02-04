import { NextRequest, NextResponse } from 'next/server'
import { db, ensureUserExists, getOrCreateAccount } from '@/lib/db'
import { PlatformAccount } from '@/lib/types'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'demo-user'
    
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
    const body = await request.json() as Partial<PlatformAccount>
    const userId = request.nextUrl.searchParams.get('userId') || 'demo-user'
    
    if (!body.platform || !body.username || !body.accountId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure user exists
    await ensureUserExists(userId)
    
    // Create account
    const account = await getOrCreateAccount(
      userId,
      body.platform,
      body.accountId,
      body.username
    )

    return NextResponse.json({ success: true, account }, { status: 201 })
  } catch (error) {
    logger.error('[API] Error creating account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
