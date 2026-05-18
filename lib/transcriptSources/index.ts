import type { MeetingRef, NormalizedTranscript } from '../types';
import { googleMeetSource } from './googleMeet';
import { zoomSource } from './zoom';
import { teamsSource } from './teams';

// Sources are tried in priority order. First non-null result wins.
const SOURCES = [googleMeetSource, zoomSource, teamsSource];

export async function fetchTranscript(
  meeting: MeetingRef,
  accessToken: string,
  userId: string,
): Promise<NormalizedTranscript | null> {
  for (const source of SOURCES) {
    const configured = await source.isConfigured(userId);
    if (!configured) continue;

    try {
      const result = await source.fetch(meeting, accessToken);
      if (result) return result;
    } catch {
      // Source failed — try next
    }
  }
  return null;
}
