const VOICE_OUTPUT_KEY = "vglytics_voice_output";

export function getVoiceOutputEnabled() {
  try {
    const saved = localStorage.getItem(
      VOICE_OUTPUT_KEY
    );

    // Voice output is ON by default
    if (saved === null) {
      return true;
    }

    return saved === "true";
  } catch (error) {
    console.error(
      "Unable to read voice setting:",
      error
    );

    return true;
  }
}

export function setVoiceOutputEnabled(enabled) {
  try {
    localStorage.setItem(
      VOICE_OUTPUT_KEY,
      String(Boolean(enabled))
    );

    return true;
  } catch (error) {
    console.error(
      "Unable to save voice setting:",
      error
    );

    return false;
  }
}