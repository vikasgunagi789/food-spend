import { useRef, useState } from "react";

import {
  Mic,
  X,
  Check,
  RotateCcw,
} from "lucide-react";

function VoiceExpense({
  onClose,
  onResult,
  response,
}) {
  const recognitionRef = useRef(null);

  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function createRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Voice recognition started");

      setListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      console.log("Voice transcript:", transcript);

      setText(transcript);
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);

      switch (event.error) {
        case "not-allowed":
          setError(
            "Microphone permission was denied. Please allow microphone access for VGlytics."
          );
          break;

        case "service-not-allowed":
          setError(
            "Speech recognition service is not available in this browser."
          );
          break;

        case "no-speech":
          setError(
            "I didn't hear anything. Please speak again."
          );
          break;

        case "audio-capture":
          setError(
            "The microphone could not be accessed."
          );
          break;

        case "network":
          setError(
            "Speech recognition needs an internet connection."
          );
          break;

        case "aborted":
          break;

        default:
          setError(
            "Unable to start voice recognition. Please try again."
          );
      }
    };

    recognition.onend = () => {
      console.log("Voice recognition ended");

      setListening(false);
    };

    return recognition;
  }

  function startListening() {
    setText("");
    setError("");

    const recognition =
      createRecognition();

    if (!recognition) {
      setError(
        "Voice input is not supported by this browser. Please try Chrome on Android or Safari on iPhone."
      );
      return;
    }

    recognitionRef.current = recognition;

    try {
      recognition.start();

      console.log(
        "Starting microphone..."
      );
    } catch (error) {
      console.error(
        "Could not start recognition:",
        error
      );

      setListening(false);

      setError(
        "Could not start the microphone. Please try again."
      );
    }
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.log(
        "Recognition already stopped."
      );
    }

    setListening(false);
  }

  function handleConfirm() {
    if (!text.trim()) {
      setError(
        "Please say something first."
      );
      return;
    }

    onResult(text.trim());
  }

  function handleRetry() {
    stopListening();

    setText("");
    setError("");

    // Small delay helps mobile browsers
    // release the previous recognition session.
    setTimeout(() => {
      startListening();
    }, 200);
  }

  return (
    <div className="voice-overlay">

      <div className="voice-modal">

        {/* HEADER */}

        <div className="voice-header">

          <div>

            <p className="voice-label">
              VGlytics
            </p>

            <h2>
              Talk to VGlytics
            </h2>

          </div>

          <button
            type="button"
            className="voice-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>


        {/* MICROPHONE */}

        <div
          className={`voice-mic ${
            listening
              ? "is-listening"
              : ""
          }`}
        >
          <Mic size={38} />
        </div>


        {/* STATUS */}

        <p className="voice-status">

          {listening
            ? "Listening..."
            : text
            ? "I heard:"
            : "Tap the microphone and speak"}

        </p>


        {/* TRANSCRIPT */}

        <div className="voice-transcript">

          {text ? (
            `"${text}"`
          ) : (
            <>
              Example:
              <br />

              <strong>
                "I had dosa for 80 rupees"
              </strong>
            </>
          )}

        </div>


        {/* ERROR */}

        {error && (
          <div className="voice-error">
            {error}
          </div>
        )}


        {/* SMART TALK RESPONSE */}

        {response && (
          <div className="talk-response">

            <p>
              {response}
            </p>

            <button
              type="button"
              className="talk-done-button"
              onClick={onClose}
            >
              Done
            </button>

          </div>
        )}


        {/* MAIN BUTTONS */}

        {!response && !text ? (

          <button
            type="button"
            className="voice-listen-button"
            onClick={
              listening
                ? stopListening
                : startListening
            }
          >

            <Mic size={20} />

            {listening
              ? "Stop Listening"
              : "Start Talking"}

          </button>

        ) : !response && text ? (

          <div className="voice-actions">

            <button
              type="button"
              className="voice-retry-button"
              onClick={handleRetry}
            >

              <RotateCcw size={18} />

              Try Again

            </button>


            <button
              type="button"
              className="voice-confirm-button"
              onClick={handleConfirm}
            >

              <Check size={18} />

              Continue

            </button>

          </div>

        ) : null}

      </div>

    </div>
  );
}

export default VoiceExpense;