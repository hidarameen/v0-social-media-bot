import { NextRequest } from 'next/server';

export function getUserId(request: NextRequest): string {
  const headerUser = request.headers.get('x-user-id');
  return headerUser ?? request.nextUrl.searchParams.get('userId') ?? 'demo-user';
}
