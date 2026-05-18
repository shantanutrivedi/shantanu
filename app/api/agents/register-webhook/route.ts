import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { upsertWebhookRegistration, getWebhookRegistration } from '@/lib/supabase';
const WEBHOOK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // Google webhooks expire after 7 days
const RENEW_BUFFER_MS = 24 * 60 * 60 * 1000;     // Renew 1 day before expiry

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = (session as any).accessToken as string;

  if (!accessToken) {
    return Response.json({ error: 'No access token' }, { status: 400 });
  }

  // Check if we already have a valid (non-expired) registration
  const existing = await getWebhookRegistration(userId);
  if (existing) {
    const renewAfter = existing.expiration - RENEW_BUFFER_MS;
    if (Date.now() < renewAfter) {
      return Response.json({ status: 'already_registered', expiration: existing.expiration });
    }
  }

  const channelId = crypto.randomUUID();
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? '';
  const webhookUrl = `${appUrl}/api/agents/calendar-webhook`;

  // Register a push channel with Google Calendar
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events/watch',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id:      channelId,
        type:    'web_hook',
        address: webhookUrl,
        expiration: Date.now() + WEBHOOK_TTL_MS,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return Response.json({ error: 'Google registration failed', details: err }, { status: 502 });
  }

  const data = await res.json();

  await upsertWebhookRegistration({
    userId,
    channelId,
    resourceId: data.resourceId,
    expiration: parseInt(data.expiration, 10),
  });

  return Response.json({ status: 'registered', expiration: data.expiration });
}
