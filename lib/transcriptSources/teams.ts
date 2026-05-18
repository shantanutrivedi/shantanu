import type { TranscriptSource, MeetingRef, NormalizedTranscript } from '../types';

// TODO: Activate when Microsoft Teams OAuth is wired in Settings.
// API: GET /me/onlineMeetings/{meetingId}/transcripts
// OAuth scope needed: OnlineMeetingTranscript.Read.All
// See: https://learn.microsoft.com/en-us/graph/api/calltranscript-get
export const teamsSource: TranscriptSource = {
  name: 'teams',

  async isConfigured(_userId: string): Promise<boolean> {
    // Return true only when a Microsoft OAuth token exists for this user
    // TODO: check userConfig for teams/microsoft token
    return false;
  },

  async fetch(_meeting: MeetingRef, _accessToken: string): Promise<NormalizedTranscript | null> {
    // TODO: implement Teams transcript fetch
    // 1. GET /me/onlineMeetings?$filter=joinWebUrl eq '{meetingUrl}'
    // 2. GET /me/onlineMeetings/{meetingId}/transcripts
    // 3. GET /me/onlineMeetings/{meetingId}/transcripts/{transcriptId}/content?$format=text/vtt
    // 4. Strip VTT timestamps, return plain text
    return null;
  },
};
