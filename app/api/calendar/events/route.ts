import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = session as any;

  if (!session)          return Response.json({ error: 'unauthenticated' }, { status: 401 });
  if (s?.tokenError)     return Response.json({ error: 'token_expired'   }, { status: 403 });
  if (!s?.accessToken)   return Response.json({ error: 'no_token'        }, { status: 403 });

  const url = new URL(req.url);
  const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const timeMin = encodeURIComponent(`${date}T00:00:00Z`);
  const timeMax = encodeURIComponent(`${date}T23:59:59Z`);

  const apiUrl =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${timeMin}&timeMax=${timeMax}` +
    `&singleEvents=true&orderBy=startTime&maxResults=20`;

  const calRes = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${s.accessToken}` },
    cache: 'no-store',
  });

  if (!calRes.ok) {
    const err = await calRes.json().catch(() => ({}));
    const status = calRes.status;
    // 401 from Google = token definitely expired / revoked — tell client to re-auth
    if (status === 401) return Response.json({ error: 'token_expired' }, { status: 403 });
    return Response.json({ error: 'calendar_api_error', detail: err }, { status });
  }

  const data = await calRes.json();

  type GEvent = {
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    hangoutLink?: string;
    description?: string;
    attendees?: { email: string; displayName?: string }[];
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  };

  const events = ((data.items ?? []) as GEvent[]).map(e => ({
    id:          e.id,
    title:       e.summary ?? '(No title)',
    start:       e.start?.dateTime ?? e.start?.date ?? '',
    end:         e.end?.dateTime   ?? e.end?.date   ?? '',
    meetLink:    e.hangoutLink ??
                 e.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri ??
                 null,
    description: e.description ?? '',
    attendees:   (e.attendees ?? []).map(a => a.displayName ?? a.email),
  }));

  return Response.json({ events });
}
