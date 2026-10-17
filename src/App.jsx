import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";

import Home from "./pages/Home";
import History from "./pages/History";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import GeneralExpenses from "./pages/GeneralExpenses";
import Auth from "./pages/Auth";
import SmartChat from "./pages/SmartChat";

import BottomNav from "./components/BottomNav";
import OfflineIndicator from "./components/OfflineIndicator";
import VoiceExpense from "./components/VoiceExpense";

import { isGeneralExpensesUnlocked } from "./utils/generalAccess";

import {
  getExpenses,
  addExpense,
} from "./services/expenseService";

import { parseVoiceExpense } from "./utils/voiceParser";
import { answerTalkQuestion } from "./utils/talkParser";
import { speak } from "./utils/speak";

import { auth } from "./lib/firebase";

import {
  syncExpenses,
  syncBudget,
} from "./services/cloudExpenseService";

import "./styles/app.css";

// =====================================================
// AUTHENTICATED APP
// =====================================================

function AuthenticatedApp({ user }) {
  const [showVoiceExpense, setShowVoiceExpense] =
    useState(false);

  const [talkResponse, setTalkResponse] =
    useState("");

  function openTalk() {
    setTalkResponse("");
    setShowVoiceExpense(true);
  }

  function closeTalk() {
    setTalkResponse("");
    setShowVoiceExpense(false);
  }

  // ===================================================
  // VOICE / TALK
  // ===================================================

  function handleVoiceResult(text) {
    console.log("VOICE INPUT:", text);

    const expenses = getExpenses();

    const talkAnswer = answerTalkQuestion(
      text,
      expenses
    );

    console.log(
      "SMART TALK:",
      talkAnswer
    );

    // -------------------------------------------------
    // SMART TALK QUESTION
    // -------------------------------------------------

    if (
      talkAnswer &&
      talkAnswer.success &&
      talkAnswer.answer
    ) {
      setTalkResponse(
        talkAnswer.answer
      );

      speak(
        talkAnswer.answer
      );

      return;
    }

    // -------------------------------------------------
    // CHECK WHETHER INPUT IS A QUESTION
    // -------------------------------------------------

    const lower = String(text)
      .toLowerCase()
      .trim();

    const isQuestion =
      lower.includes("?") ||
      lower.startsWith("how ") ||
      lower.startsWith("what ") ||
      lower.startsWith("which ") ||
      lower.startsWith("where ") ||
      lower.startsWith("when ") ||
      lower.startsWith("why ") ||
      lower.startsWith("can ") ||
      lower.startsWith("do ") ||
      lower.startsWith("is ") ||
      lower.includes("how much") ||
      lower.includes("tell me");

    if (isQuestion) {
      const message =
        "I couldn't understand that question. Try asking about your spending, budget, categories, or expenses.";

      setTalkResponse(message);

      speak(message);

      return;
    }

    // -------------------------------------------------
    // PARSE VOICE EXPENSE
    // -------------------------------------------------

    const result =
      parseVoiceExpense(text);

    console.log(
      "EXPENSE PARSER:",
      result
    );

    if (!result.success) {
      setTalkResponse(
        result.error
      );

      return;
    }

    // -------------------------------------------------
    // SAVE EXPENSE LOCALLY
    // -------------------------------------------------

    const newExpense =
      addExpense(
        result.expense
      );

    const message =
      `Added ${newExpense.itemName} — ₹${newExpense.amount}.`;

    setTalkResponse(message);

    speak(message);

    // Refresh pages
    window.dispatchEvent(
      new Event("focus")
    );

    window.dispatchEvent(
      new Event("expensesUpdated")
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="app">

      <OfflineIndicator />

      <main className="app-content">

        <Routes>

          {/* HOME */}

          <Route
            path="/"
            element={<Home />}
          />

          {/* HISTORY */}

          <Route
            path="/history"
            element={<History />}
          />

          {/* STATISTICS */}

          <Route
            path="/statistics"
            element={<Statistics />}
          />

          {/* SETTINGS */}

          <Route
            path="/settings"
            element={
              <Settings user={user} />
            }
          />
          <Route
  path="/smart-chat"
  element={<SmartChat />}
/>


          {/* GENERAL EXPENSES */}

          <Route
            path="/general-expenses"
            element={
              isGeneralExpensesUnlocked() ? (
                <GeneralExpenses />
              ) : (
                <Navigate
                  to="/settings"
                  replace
                />
              )
            }
          />

          {/* LOGIN / SIGNUP */}

          <Route
            path="/auth"
            element={<Auth />}
          />

          {/* UNKNOWN ROUTES */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </main>

      <BottomNav
        onTalk={openTalk}
      />

      {showVoiceExpense && (
        <VoiceExpense
          onClose={closeTalk}
          onResult={handleVoiceResult}
          response={talkResponse}
        />
      )}

    </div>
  );
}

// =====================================================
// APP CONTENT
// =====================================================

function AppContent() {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // FIREBASE AUTH STATE
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          console.log(
            "Firebase user:",
            currentUser
          );

          // ------------------------------------------------
          // UPDATE AUTH STATE
          // ------------------------------------------------

          setUser(
            currentUser
          );

          // =================================================
          // USER LOGGED IN
          // =================================================

          if (currentUser) {

            try {

              console.log(
                "VGlytics: starting safe sync..."
              );

              // ------------------------------------------------
              // SAFE EXPENSE SYNC
              //
              // Local + Firebase are merged.
              // Local data is NOT blindly replaced.
              // ------------------------------------------------

              const syncedExpenses =
                await syncExpenses(
                  currentUser
                );

              console.log(
                "VGlytics: expenses synced:",
                syncedExpenses.length
              );

              // ------------------------------------------------
              // SAFE BUDGET SYNC
              // ------------------------------------------------

              const syncedBudget =
                await syncBudget(
                  currentUser
                );

              console.log(
                "VGlytics: budget synced:",
                syncedBudget
              );

              // ------------------------------------------------
              // NOTIFY ALL PAGES
              // ------------------------------------------------

              window.dispatchEvent(
                new Event(
                  "expenses-synced"
                )
              );

              window.dispatchEvent(
                new Event(
                  "budget-synced"
                )
              );

            } catch (error) {

              console.error(
                "VGlytics sync failed:",
                error
              );

              // IMPORTANT:
              // Even if Firebase fails,
              // the app continues using local data.
              window.dispatchEvent(
                new Event(
                  "expenses-synced"
                )
              );
            }

          }

          // =================================================
          // USER LOGGED OUT
          // =================================================

          else {

            console.log(
              "VGlytics: user logged out."
            );

            console.log(
              "VGlytics: keeping local expenses."
            );

            // ------------------------------------------------
            // IMPORTANT
            //
            // DO NOT:
            //
            // localStorage.clear()
            //
            // localStorage.removeItem(
            //   "foodspend_expenses"
            // )
            //
            // The local expenses stay untouched.
            // ------------------------------------------------

            const localExpenses =
              getExpenses();

            console.log(
              "VGlytics: local expenses available after logout:",
              localExpenses.length
            );

            // Tell Home / History / Statistics
            // to reload their local data.

            window.dispatchEvent(
              new Event(
                "expenses-synced"
              )
            );

            window.dispatchEvent(
              new Event(
                "budget-synced"
              )
            );
          }

          // =================================================
          // AUTH CHECK FINISHED
          // =================================================

          setLoading(false);
        }
      );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      unsubscribe();
    };

  }, []);

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eef7f7",
          color: "#111827",
          fontSize: "15px",
          fontWeight: 600,
        }}
      >
        Loading VGlytics...
      </div>
    );
  }

  // =====================================================
  // IMPORTANT
  //
  // VGlytics remains usable without Firebase login.
  // =====================================================

  return (
    <AuthenticatedApp
      user={user}
    />
  );
}

// =====================================================
// ROOT APP
// =====================================================

function App() {

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;