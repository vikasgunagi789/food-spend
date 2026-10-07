import { useState } from "react";

import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

import {
  isGeneralExpensesUnlocked,
  unlockGeneralExpenses,
  lockGeneralExpenses,
} from "../utils/generalAccess";

export default function GeneralExpenseUnlock() {
  const [unlocked, setUnlocked] =
    useState(
      isGeneralExpensesUnlocked()
    );

  const [code, setCode] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function handleUnlock() {
    setError("");
    setSuccess("");

    const correct =
      unlockGeneralExpenses(code);

    if (!correct) {
      setError(
        "Incorrect access code."
      );

      return;
    }

    setUnlocked(true);
    setCode("");

    setSuccess(
      "General Expenses unlocked successfully."
    );

    window.dispatchEvent(
      new Event(
        "general-expenses-unlocked"
      )
    );
  }

  function handleLock() {
    lockGeneralExpenses();

    setUnlocked(false);
    setCode("");
    setError("");
    setSuccess("");

    window.dispatchEvent(
      new Event(
        "general-expenses-locked"
      )
    );
  }

  return (
    <section className="general-unlock-card">

      <div className="general-unlock-header">

        <div className="general-unlock-icon">
          {unlocked ? (
            <ShieldCheck size={22} />
          ) : (
            <Lock size={22} />
          )}
        </div>

        <div>
          <h3>
            General Expenses
          </h3>

          <p>
            Track transportation,
            recharge, stationery,
            education and other
            non-food expenses.
          </p>
        </div>

      </div>

      {unlocked ? (
        <div>

          <div className="general-unlocked-message">
            <CheckCircle2 size={18} />

            <span>
              General Expenses unlocked
            </span>
          </div>

          {success && (
            <p className="general-success">
              {success}
            </p>
          )}

          <button
            type="button"
            className="general-lock-button"
            onClick={handleLock}
          >
            <Lock size={17} />

            Lock General Expenses
          </button>

        </div>
      ) : (
        <div>

          <label className="general-code-label">
            <KeyRound size={15} />

            Enter premium access code
          </label>

          <input
            type="password"
            value={code}
            onChange={(event) => {
              setCode(
                event.target.value
              );

              setError("");
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                handleUnlock();
              }
            }}
            placeholder="Enter access code"
            className="general-code-input"
          />

          {error && (
            <p className="general-error">
              {error}
            </p>
          )}

          <button
            type="button"
            className="general-unlock-button"
            onClick={handleUnlock}
          >
            <ShieldCheck size={18} />

            Unlock General Expenses
          </button>

        </div>
      )}

    </section>
  );
}