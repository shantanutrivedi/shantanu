import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!session) return Response.json({ error: 'unauthenticated' }, { status: 401 });
  if (!accessToken) return Response.json({ error: 'no_token' }, { status: 403 });

  const url = new URL(req.url);
  const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  // Build time window for the requested day in the user's local midnight (UTC midnight of the date string)
  const timeMin = encodeURIComponent(`${date}T00:00:00Z`);
  const timeMax = encodeURIComponent(`${date}T23:59:59Z`);

  const apiUrl =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${timeMin}&timeMax=${timeMax}` +
    `&singleEvents=true&orderBy=startTime&maxResults=20`;

  const calRes = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  });

  if (!calRes.ok) {
    const err = await calRes.json().catch(() => ({}));
    return Response.json({ error: 'calendar_api_error', detail: err }, { status: calRes.status });
  }

  const data = await calRes.json();

  // Normalise events into a compact shape the UI needs
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
    id: e.id,
    title: e.summary ?? '(No title)',
    start: e.start?.dateTime ?? e.start?.date ?? '',
    end: e.end?.dateTime ?? e.end?.date ?? '',
    meetLink:
      e.hangoutLink ??
      e.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri ??
      null,
    description: e.description ?? '',
    attendees: (e.attendees ?? []).map(a => a.displayName ?? a.email),
  }));

  return Response.json({ events });
}
