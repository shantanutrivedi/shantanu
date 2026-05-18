import type { TranscriptSource, MeetingRef, NormalizedTranscript } from '../types';

// Fetches transcript from Google Drive.
// After a Google Meet ends, Meet auto-creates a Doc in the organiser's Drive
// titled "[Meeting Name] - Transcript". We find it via Drive API and read the content.
export const googleMeetSource: TranscriptSource = {
  name: 'google-meet',

  async isConfigured(_userId: string): Promise<boolean> {
    // Always available — uses the same Google OAuth token as calendar
    return true;
  },

  async fetch(meeting: MeetingRef, accessToken: string): Promise<NormalizedTranscript | null> {
    if (meeting.platform !== 'google-meet' && meeting.platform !== 'unknown') {
      return null;
    }

    // Strategy 1: Search Drive for a transcript Doc created after the meeting
    const transcript = await fetchFromDrive(meeting, accessToken);
    if (transcript) return transcript;

    // Strategy 2: Parse a transcript link from the calendar event description
    if (meeting.description) {
      const fromDescription = await fetchFromDescription(meeting, accessToken);
      if (fromDescription) return fromDescription;
    }

    return null;
  },
};

async function fetchFromDrive(
  meeting: MeetingRef,
  accessToken: string,
): Promise<NormalizedTranscript | null> {
  const meetingEndTime = new Date(meeting.endTime).toISOString();

  // Search for a transcript Doc created after the meeting ended
  const query = encodeURIComponent(
    `name contains 'Transcript' and mimeType = 'application/vnd.google-apps.document' and modifiedTime > '${meetingEndTime}'`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime+desc&pageSize=5&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!searchRes.ok) return null;
  const { files } = await searchRes.json();
  if (!files || files.length === 0) return null;

  // Find the one most likely related to this meeting by title match
  const titleWords = meeting.meetingTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const match = files.find((f: { name: string }) =>
    titleWords.some(w => f.name.toLowerCase().includes(w))
  ) ?? files[0];

  // Export the Google Doc as plain text
  const exportRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${match.id}/export?mimeType=text/plain`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!exportRes.ok) return null;
  const text = await exportRes.text();
  if (!text || text.trim().length < 100) return null;

  return {
    source:       'google-meet',
    confidence:   'auto',
    text:         text.trim(),
    meetingTitle: meeting.meetingTitle,
    meetingId:    meeting.eventId,
  };
}

async function fetchFromDescription(
  meeting: MeetingRef,
  accessToken: string,
): Promise<NormalizedTranscript | null> {
  if (!meeting.description) return null;

  // Google Meet puts a transcript link in the format:
  // "Transcript: https://docs.google.com/document/d/DOCID/edit"
  const match = meeting.description.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;

  const docId = match[1];
  const exportRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!exportRes.ok) return null;
  const text = await exportRes.text();
  if (!text || text.trim().length < 100) return null;

  return {
    source:       'google-meet',
    confidence:   'auto',
    text:         text.trim(),
    meetingTitle: meeting.meetingTitle,
    meetingId:    meeting.eventId,
  };
}
