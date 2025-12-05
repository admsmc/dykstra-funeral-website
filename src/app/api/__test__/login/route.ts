import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST() {
  // Only available during Playwright runs
  if (process.env.PLAYWRIGHT !== '1') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const email = process.env.CLERK_TEST_USER_EMAIL;
  if (!email) return NextResponse.json({ error: 'CLERK_TEST_USER_EMAIL not set' }, { status: 400 });

  // Find the test user
  const users = await clerkClient.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users?.[0];
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 400 });

  // Create a session for the user
  const session = await clerkClient.sessions.createSession({ userId: user.id });

  // Set Clerk session cookie (__session)
  const res = NextResponse.json({ ok: true, userId: user.id, sessionId: session.id });
  res.cookies.set('__session', session.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
