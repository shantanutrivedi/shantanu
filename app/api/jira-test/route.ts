import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { baseUrl, email, apiToken } = await req.json();

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  const base = baseUrl.replace(/\/$/, '');
  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');

  try {
    const res = await fetch(`${base}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({
        ok: false,
        error: err.message || `Jira returned ${res.status}`,
      });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, displayName: data.displayName || data.emailAddress });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Could not reach Jira — check base URL' });
  }
}
