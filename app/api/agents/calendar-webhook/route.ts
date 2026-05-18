import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Receives Google Calendar Pub/Sub push notifications.
// Google sends an empty POST with headers only — no body payload.
// Docs: https://developers.google.com/calendar/api/guides/push
export async function POST(req: NextRequest) {
  const channelId    = req.headers.get('x-goog-channel-id') ?? '';
  const resourceState = req.headers.get('x-goog-resource-state') ?? '';
  const resourceId   = req.headers.get('x-goog-resource-id') ?? '';

  // Acknowledge immediately — Google requires a 2xx within 10 seconds
  // or it will retry and eventually revoke the channel.

  // Initial sync handshake — nothing to process
  if (resourceState === 'sync') {
    return new Response(null, { status: 200 });
  }

  if (resourceState !== 'exists') {
    return new Response(null, { status: 200 });
  }

  // Validate the channel is one we registered
  if (!supabase) {
    return new Response(null, { status: 200 });
  }

  const { data: reg } = await supabase
    .from('webhook_registrations')
    .select('user_id')
    .eq('channel_id', channelId)
    .eq('resource_id', resourceId)
    .maybeSingle();

  if (!reg) {
    // Unknown channel — ignore (could be a leftover registration)
    return new Response(null, { status: 200 });
  }

  // Enqueue a transcript-fetch job for this user.
  // The actual calendar diff and transcript fetch happens asynchronously
  // to keep this response well under Google's 10-second window.
  await supabase.from('agent_jobs').insert({
    type:    'fetch_transcript',
    user_id: reg.user_id,
    payload: { triggeredAt: new Date().toISOString() },
    status:  'queued',
  }).then(() => {
    // fire-and-forget: if this insert fails the job is just missed this cycle
  });

  return new Response(null, { status: 200 });
}
