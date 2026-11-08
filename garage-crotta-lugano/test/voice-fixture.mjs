// Chromium loops --use-file-for-fake-audio-capture for as long as the
// microphone stream is open. A clip shorter than the listen window is heard
// again. The fixture must be one question followed by silence that outlasts
// the listen window, so the phrase cannot repeat inside one session.
export const VOICE_LISTEN_MS = 22000;

export function wavCoversListenWindow(durationSeconds, listenMs = VOICE_LISTEN_MS) {
  return Number(durationSeconds) * 1000 >= listenMs + 8000;
}

export function voiceExchangeDone(ev) {
  const users = (ev && ev.userTranscripts) || [];
  const agents = (ev && ev.assistantReplies) || [];
  return users.filter(Boolean).length >= 1 && agents.filter(Boolean).length >= 2;
}

// The microphone stream starts when the session is opened, and the recognizer
// is not ready during the first seconds. Speech that ends before that is missed,
// which the provider records as a user-turn timeout rather than words.
export const MIN_SPEECH_LEAD_SECONDS = 6;

export function speechCanBeHeardOnce({ durationSeconds, speechStart, speechEnd, listenMs = VOICE_LISTEN_MS, minLead = MIN_SPEECH_LEAD_SECONDS }) {
  if (!wavCoversListenWindow(durationSeconds, listenMs)) return false;
  if (!(speechStart >= minLead)) return false;
  if (!(speechEnd > speechStart)) return false;
  if (speechEnd * 1000 > listenMs) return false;
  return true;
}
