import { NextRequest, NextResponse } from 'next/server';

interface JiraItem { id: string; jiraUrl: string; }
interface SyncResult { id: string; status: string; summary: string; jiraStatus: string; }

// Extract issue key from a Jira URL like https://company.atlassian.net/browse/PROJ-123
function extractIssueKey(url: string): string | null {
  const m = url.match(/\/browse\/([A-Z][A-Z0-9_]+-\d+)/i);
  return m ? m[1].toUpperCase() : null;
}

// Map Jira status category name → our ActionItem status
function mapJiraStatus(jiraStatusName: string): string {
  const name = jiraStatusName.toLowerCase();
  if (name === 'done' || name === 'closed' || name === 'resolved') return 'Done';
  if (name === 'in progress' || name === 'in review' || name === 'in development') return 'In Progress';
  if (name === 'blocked' || name === 'impediment') return 'Blocked';
  return 'Pending';
}

export async function POST(req: NextRequest) {
  const { items, jiraConfig } = await req.json() as {
    items: JiraItem[];
    jiraConfig: { baseUrl: string; email: string; apiToken: string };
  };

  if (!jiraConfig?.baseUrl || !jiraConfig?.email || !jiraConfig?.apiToken) {
    return NextResponse.json({ error: 'Jira not configured. Go to Settings → Connectors.' }, { status: 400 });
  }

  const base = jiraConfig.baseUrl.replace(/\/$/, '');
  const credentials = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64');
  const headers = { Authorization: `Basic ${credentials}`, Accept: 'application/json' };

  const results: SyncResult[] = [];

  await Promise.all(
    items.map(async (item) => {
      const key = extractIssueKey(item.jiraUrl);
      if (!key) {
        results.push({ id: item.id, status: '', summary: '', jiraStatus: 'Invalid URL' });
        return;
      }

      try {
        const res = await fetch(
          `${base}/rest/api/3/issue/${key}?fields=status,summary`,
          { headers }
        );

        if (!res.ok) {
          results.push({ id: item.id, status: '', summary: '', jiraStatus: `Error ${res.status}` });
          return;
        }

        const data = await res.json();
        const jiraStatusName: string = data.fields?.status?.name || '';
        const mappedStatus = mapJiraStatus(jiraStatusName);
        const summary: string = data.fields?.summary || '';

        results.push({ id: item.id, status: mappedStatus, summary, jiraStatus: jiraStatusName });
      } catch {
        results.push({ id: item.id, status: '', summary: '', jiraStatus: 'Fetch error' });
      }
    })
  );

  return NextResponse.json({ results });
}
