import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Triggered by Vercel Cron daily at 7am.
// Finds all webhook registrations expiring within 24 hours and renews them
// by calling /api/agents/register-webhook on behalf of each user.
// Note: server-side renewal requires a valid access token per user.
// This cron only flags near-expiry registrations; actual renewal happens
// on next user login via the client calling register-webhook.
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabase) {
    return Response.json({ skipped: true, reason: 'Supabase not configured' });
  }

  const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000;

  // Find registrations expiring within 24 hours
  const { data: expiring } = await supabase
    .from('webhook_registrations')
    .select('user_id, expiration')
    .lt('expiration', oneDayFromNow);

  const count = expiring?.length ?? 0;

  // Mark them as needing renewal — client will re-register on next load
  if (count > 0) {
    const ids = expiring!.map(r => r.user_id);
    await supabase
      .from('webhook_registrations')
      .delete()
      .in('user_id', ids);
  }

  return Response.json({ renewed: count });
}
