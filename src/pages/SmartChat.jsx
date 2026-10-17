
import { useState } from "react";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Mic,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getExpenses } from "../services/expenseService";
import { answerTalkQuestion } from "../utils/talkParser";

import {
  classifyFoodAiQuestion,
  getFoodRecommendations,
} from "../services/foodAiService";

import { askNutritionQuestion } from "../services/nutritionService";

// Extract a budget such as ₹40, Rs. 40, or under 40.
function findBudget(question) {
  const patterns = [
    /(?:under|below|within|less than|budget(?:\s+of)?|up to|upto)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i,
    /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);

    if (match) {
      const amount = Number(match[1]);

      if (Number.isFinite(amount) && amount >= 0) {
        return amount;
      }
    }
  }

  return null;
}

function findFoodCategory(question) {
  const text = question.toLowerCase();

  if (/\bbreakfast\b/.test(text)) return "breakfast";
  if (/\blunch\b/.test(text)) return "lunch";

  if (/\b(snack|snacks)\b/.test(text)) {
    return "snack";
  }

  if (/\b(drink|drinks|beverage|beverages)\b/.test(text)) {
    return "drink";
  }

  return "any";
}

// Identify food recommendation questions.
function isFoodRecommendationQuestion(question) {
  return (
    /\b(food|eat|meal|meals|breakfast|lunch|snack|snacks|drink|drinks|beverage|beverages|vegetarian|veg)\b/i.test(
      question
    ) &&
    /\b(suggest|recommend|recommendation|options|what can i eat|what should i eat|under|below|within|cheap|affordable|budget)\b/i.test(
      question
    )
  );
}

// Identify nutrition questions.
function isNutritionQuestion(question) {
  return /\b(calories?|nutrition|nutritional|protein|carbs|carbohydrates|vitamins?|iron|fat content|macros?)\b/i.test(
    question
  );
}

// Format food recommendations returned by the Python API.
function formatRecommendations(data) {
  const foods = data.recommendations || [];

  if (foods.length === 0) {
    return `I couldn't find a matching food option within ₹${data.budget}. Try increasing your budget or changing the food category.`;
  }

  const lines = foods.map((food) => {
    const name = food.name || food.itemName || "Food option";
    const price = Number(food.price);

    const description = food.description
      ? ` — ${food.description}`
      : "";

    return `${name} — ₹${price}${description}`;
  });

  return [
    `Here are food options within your ₹${data.budget} budget:`,
    "",
    ...lines,
  ].join("\n");
}

export default function SmartChat() {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm VGlytics Smart Chat. Ask me about your expenses, budget, food recommendations, or nutrition information such as calories and protein.",
    },
  ]);

  async function sendMessage(event) {
    event.preventDefault();

    const question = input.trim();

    if (!question || isSending) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
    ]);

    setInput("");
    setVoiceStatus("");
    setIsSending(true);

    let answer =
      "I couldn't answer that yet. Try asking about your spending, budget, food recommendations, or nutrition.";

    try {
      // Read existing expense data without modifying it.
      const expenses = getExpenses();
      const localResult = answerTalkQuestion(question, expenses);

      // 1. Nutrition questions use the nutrition CSV API.
      if (isNutritionQuestion(question)) {
        const nutritionData = await askNutritionQuestion(question);

        answer = nutritionData.answer;
      }

      // 2. Food recommendations use the existing food API.
      else if (isFoodRecommendationQuestion(question)) {
        const budget = findBudget(question);

        if (budget === null) {
          answer =
            'What is your food budget? For example: "Suggest vegetarian food under ₹40".';
        } else {
          const recommendationData = await getFoodRecommendations({
            budget,
            category: findFoodCategory(question),
            vegetarianOnly: /\bvegetarian\b|\bveg only\b/i.test(
              question
            ),
          });

          answer = formatRecommendations(recommendationData);
        }
      }

      // 3. Expense and budget questions use the existing parser.
      else if (localResult?.success && localResult.answer) {
        answer = localResult.answer;
      }

      // 4. Other questions use the existing Python chat classifier.
      else {
        try {
          const aiResult = await classifyFoodAiQuestion(question);

          if (aiResult?.answer) {
            answer = aiResult.answer;
          }
        } catch (apiError) {
          console.warn("Python chat API error:", apiError);

          answer =
            "I couldn't process that question. Please check that the Python AI API is running and try again.";
        }
      }
    } catch (error) {
      console.error("Smart Chat error:", error);

      // If an API request fails, preserve the existing local
      // expense-answering functionality as a fallback.
      try {
        const result = answerTalkQuestion(question, getExpenses());

        if (result?.success && result.answer) {
          answer = result.answer;
        } else {
          answer =
            "I couldn't retrieve that information. Check that the Python AI API is running and try again.";
        }
      } catch (fallbackError) {
        console.error("Smart Chat fallback failed:", fallbackError);

        answer =
          "Sorry, I couldn't retrieve your information. Please try again.";
      }
    } finally {
      setIsSending(false);
    }

    setMessages((previous) => [
      ...previous,
      { role: "assistant", text: answer },
    ]);
  }

  function askByVoice() {
    if (isListening || isSending) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus(
        "Voice input isn't supported by this browser. Please type your question."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setVoiceStatus("Listening... Speak now");

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setInput(transcript);

      const latestResult = event.results[event.results.length - 1];

      if (latestResult.isFinal) {
        setVoiceStatus("Voice captured! Press Send to ask.");
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setVoiceStatus(
          "Microphone access denied. Allow microphone permission in your browser."
        );
      } else if (event.error === "no-speech") {
        setVoiceStatus(
          "No speech detected. Tap the microphone and try again."
        );
      } else {
        setVoiceStatus(
          "Voice input failed. Please try again or type your question."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      setVoiceStatus((previous) =>
        previous === "Listening... Speak now"
          ? "Listening ended. Tap the microphone to try again."
          : previous
      );
    };

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);

      setVoiceStatus(
        "Couldn't start the microphone. Please try again."
      );
    }
  }

  return (
    <div className="smart-chat-page">
      <header className="smart-chat-header">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          title="Back to home"
        >
          <ArrowLeft size={20} />
        </button>

        <MessageCircle size={24} />

        <div>
          <h2>VGlytics Smart Chat</h2>
          <p>Ask about expenses, food, and nutrition</p>
        </div>
      </header>

      <div className="smart-chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`smart-chat-message ${message.role}`}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {message.text}
          </div>
        ))}

        {isSending && (
          <div
            className="smart-chat-message assistant"
            role="status"
          >
            Thinking...
          </div>
        )}
      </div>

      {voiceStatus && (
        <div
          className={`smart-chat-voice-status ${
            isListening ? "is-listening" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {isListening && <span className="smart-chat-pulse" />}
          {voiceStatus}
        </div>
      )}

      <form className="smart-chat-input" onSubmit={sendMessage}>
        <button
          type="button"
          className={`smart-chat-mic-button ${
            isListening ? "is-listening" : ""
          }`}
          onClick={askByVoice}
          aria-label={
            isListening ? "Listening to your voice" : "Start voice input"
          }
          title={isListening ? "Listening... Speak now" : "Tap to speak"}
          disabled={isListening || isSending}
        >
          <Mic size={20} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about food, spending, or nutrition..."
          aria-label="Your question"
          disabled={isSending}
        />

        <button
          type="submit"
          aria-label="Send message"
          title="Send message"
          disabled={!input.trim() || isSending}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
