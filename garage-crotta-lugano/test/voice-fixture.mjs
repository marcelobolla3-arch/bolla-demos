// Chromium loops --use-file-for-fake-audio-capture for as long as the
// microphone stream is open. A clip shorter than the listen window is heard
// again. The fixture must be one question followed by silence that outlasts
// the listen window, so the phrase cannot repeat inside one session.
export const VOICE_LISTEN_MS = 26000;

export function wavCoversListenWindow(durationSeconds, listenMs = VOICE_LISTEN_MS) {
  return Number(durationSeconds) * 1000 >= listenMs + 8000;
}

function recognizedWords(text) {
  const value = String(text || "").trim();
  return value.length > 0 && !/^[.\s…]+$/.test(value);
}

export function voiceExchangeDone(ev) {
  const users = ((ev && ev.userTranscripts) || []).filter(recognizedWords);
  const agents = ((ev && ev.assistantReplies) || []).filter(Boolean);
  return users.length >= 1 && agents.length >= 2;
}

// The recognizer is not listening while the session connects and the greeting
// plays. Speech in that opening is recorded as a user-turn timeout, not words.
// Twelve seconds clears that startup on the sessions already measured.
export const MIN_SPEECH_LEAD_SECONDS = 12;

export function speechCanBeHeardOnce({ durationSeconds, speechStart, speechEnd, listenMs = VOICE_LISTEN_MS, minLead = MIN_SPEECH_LEAD_SECONDS }) {
  if (!wavCoversListenWindow(durationSeconds, listenMs)) return false;
  if (!(speechStart >= minLead)) return false;
  if (!(speechEnd > speechStart)) return false;
  if (speechEnd * 1000 > listenMs) return false;
  const regions = arguments[0].regions;
  if (regions && regions.length !== 1) return false;
  return true;
}

export function speechRegionsFromSilenceLog(log, durationSeconds) {
  const starts = [...String(log).matchAll(/silence_start:\s*([0-9.]+)/g)].map((match) => Number(match[1]));
  const ends = [...String(log).matchAll(/silence_end:\s*([0-9.]+)/g)].map((match) => Number(match[1]));
  const regions = [];
  for (let i = 0; i < ends.length; i++) {
    const speechStart = ends[i];
    const speechEnd = starts[i + 1] != null ? starts[i + 1] : Number(durationSeconds);
    if (speechEnd - speechStart > 0.2) regions.push({ speechStart, speechEnd });
  }
  return regions;
}
