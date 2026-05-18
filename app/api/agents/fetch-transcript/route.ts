import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { fetchTranscript } from '@/lib/transcriptSources';
import type { MeetingRef } from '@/lib/types';

// Fetches a transcript for a given meeting reference.
// Tries sources in priority order: google-meet → zoom → teams → manual fallback.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = (session as any).accessToken as string;
  const body: { meeting: MeetingRef } = await req.json();

  if (!body.meeting) {
    return Response.json({ error: 'Missing meeting ref' }, { status: 400 });
  }

  const transcript = await fetchTranscript(body.meeting, accessToken, session.user.id);

  if (!transcript) {
    // No auto source found — signal the client to prompt for manual entry
    return Response.json({ found: false, requiresManualEntry: true });
  }

  return Response.json({ found: true, transcript });
}
