import type { TranscriptSource, MeetingRef, NormalizedTranscript } from '../types';

// TODO: Activate when ZoomCard OAuth is wired in Settings.
// API: GET /recordings/{meetingId}/recording_files → filter file_type = "TRANSCRIPT" (VTT)
// OAuth scope needed: recording:read
// See: https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/recordingGet
export const zoomSource: TranscriptSource = {
  name: 'zoom',

  async isConfigured(_userId: string): Promise<boolean> {
    // Return true only when a Zoom OAuth token exists for this user
    // TODO: check userConfig for zoom token
    return false;
  },

  async fetch(_meeting: MeetingRef, _accessToken: string): Promise<NormalizedTranscript | null> {
    // TODO: implement Zoom transcript fetch
    // 1. GET /recordings/{meetingId}/recording_files
    // 2. Find file where file_type = "TRANSCRIPT"
    // 3. Download VTT, strip timestamps, return plain text
    return null;
  },
};
