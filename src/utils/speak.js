import {
  getVoiceOutputEnabled,
} from "../services/voiceSettings";

export function speak(text) {
  if (!text || !text.trim()) {
    return;
  }

  // Don't speak if voice output is disabled
  if (!getVoiceOutputEnabled()) {
    return;
  }

  if (!("speechSynthesis" in window)) {
    console.warn(
      "Speech synthesis is not supported in this browser."
    );
    return;
  }

  // Stop anything currently being spoken
  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(
    utterance
  );
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}