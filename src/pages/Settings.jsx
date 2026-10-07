import { useEffect, useState } from "react";

import { signOut } from "firebase/auth";

import GeneralExpenseUnlock from "../components/GeneralExpenseUnlock";

import {
  Wallet,
  Database,
  Info,
  Check,
  Volume2,
  User,
  LogIn,
  LogOut,
} from "lucide-react";

import {
  getBudget,
  setBudget,
  getExpenses,
  backupLocalExpenses,
} from "../services/expenseService";

import {
  getCloudBudget,
  setCloudBudget,
} from "../services/cloudExpenseService";

import {
  getVoiceOutputEnabled,
  setVoiceOutputEnabled,
} from "../services/voiceSettings";

import { auth } from "../lib/firebase";

// =====================================================
// SETTINGS PAGE
// =====================================================

function Settings({ user }) {

  // ===================================================
  // VOICE OUTPUT
  // ===================================================

  const [voiceOutput, setVoiceOutput] =
    useState(() =>
      getVoiceOutputEnabled()
    );

  // ===================================================
  // MONTHLY BUDGET
  // ===================================================

  const [budget, setBudgetValue] =
    useState(
      String(getBudget())
    );

  const [saved, setSaved] =
    useState(false);

  const [savingBudget, setSavingBudget] =
    useState(false);

  // ===================================================
  // EXPENSE DATA
  // ===================================================

  const [expenses, setExpenses] =
    useState(() =>
      getExpenses()
    );

  // ===================================================
  // REFRESH LOCAL EXPENSES
  // ===================================================

  useEffect(() => {

    function refreshExpenses() {
      setExpenses(
        getExpenses()
      );
    }

    window.addEventListener(
      "expenses-synced",
      refreshExpenses
    );

    window.addEventListener(
      "expensesUpdated",
      refreshExpenses
    );

    window.addEventListener(
      "focus",
      refreshExpenses
    );

    return () => {
      window.removeEventListener(
        "expenses-synced",
        refreshExpenses
      );

      window.removeEventListener(
        "expensesUpdated",
        refreshExpenses
      );

      window.removeEventListener(
        "focus",
        refreshExpenses
      );
    };

  }, []);

  // ===================================================
  // LOAD CLOUD BUDGET
  // ===================================================

  useEffect(() => {

    async function loadCloudBudget() {

      if (!user) {
        setBudgetValue(
          String(getBudget())
        );

        return;
      }

      try {

        const cloudBudget =
          await getCloudBudget(
            user
          );

        if (cloudBudget !== null) {

          setBudget(
            cloudBudget
          );

          setBudgetValue(
            String(cloudBudget)
          );

        } else {

          setBudgetValue(
            String(getBudget())
          );

        }

      } catch (error) {

        console.error(
          "Unable to load cloud budget:",
          error
        );

        setBudgetValue(
          String(getBudget())
        );
      }
    }

    loadCloudBudget();

  }, [user]);

  // ===================================================
  // BUDGET SYNC EVENT
  // ===================================================

  useEffect(() => {

    function handleBudgetSynced() {

      const currentBudget =
        getBudget();

      setBudgetValue(
        String(currentBudget)
      );
    }

    window.addEventListener(
      "budget-synced",
      handleBudgetSynced
    );

    return () => {

      window.removeEventListener(
        "budget-synced",
        handleBudgetSynced
      );

    };

  }, []);

  // ===================================================
  // TOTAL EXPENSES
  // ===================================================

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    );

  // ===================================================
  // VOICE OUTPUT
  // ===================================================

  function handleVoiceOutputChange() {

    const newValue =
      !voiceOutput;

    const success =
      setVoiceOutputEnabled(
        newValue
      );

    if (success) {
      setVoiceOutput(
        newValue
      );
    }
  }

  // ===================================================
  // SAVE BUDGET
  // ===================================================

  async function handleSaveBudget(e) {

    e.preventDefault();

    const amount =
      Number(budget);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      alert(
        "Please enter a valid budget."
      );

      return;
    }

    if (savingBudget) {
      return;
    }

    setSavingBudget(true);

    try {

      // -----------------------------------------------
      // SAVE TO FIREBASE
      // -----------------------------------------------

      if (user) {

        await setCloudBudget(
          user,
          amount
        );
      }

      // -----------------------------------------------
      // SAVE LOCALLY
      // -----------------------------------------------

      const localSaved =
        setBudget(amount);

      if (!localSaved) {

        alert(
          "Unable to save the budget."
        );

        return;
      }

      setBudgetValue(
        String(amount)
      );

      // -----------------------------------------------
      // NOTIFY OTHER PAGES
      // -----------------------------------------------

      window.dispatchEvent(
        new Event(
          "budget-synced"
        )
      );

      // -----------------------------------------------
      // SAVED MESSAGE
      // -----------------------------------------------

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);

    } catch (error) {

      console.error(
        "Unable to save budget:",
        error
      );

      alert(
        "The budget could not be saved to Firebase. Please check your internet connection and try again."
      );

    } finally {

      setSavingBudget(false);
    }
  }

  // ===================================================
  // SAFE LOGOUT
  // ===================================================

  async function handleLogout() {

    try {

      // ------------------------------------------------
      // IMPORTANT:
      // Create a device backup BEFORE logout.
      // ------------------------------------------------

      const backupCreated =
        backupLocalExpenses();

      console.log(
        "VGlytics: local expense backup before logout:",
        backupCreated
      );

      // ------------------------------------------------
      // Firebase sign out
      //
      // This does NOT clear localStorage.
      // ------------------------------------------------

      await signOut(auth);

      // ------------------------------------------------
      // Tell pages to reload local expenses.
      // ------------------------------------------------

      window.dispatchEvent(
        new Event(
          "expenses-synced"
        )
      );

      console.log(
        "VGlytics: logout complete. Local expenses preserved."
      );

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

      alert(
        "Unable to log out. Please try again."
      );
    }
  }

  // ===================================================
  // CLEAR ALL FOOD DATA
  // ===================================================

  function clearAllData() {

    const confirmed =
      window.confirm(
        "This will permanently delete all your Food expenses from this device. Continue?"
      );

    if (!confirmed) {
      return;
    }

    // Explicit user action only.
    localStorage.removeItem(
      "foodspend_expenses"
    );

    // Also remove the separate local backup.
    localStorage.removeItem(
      "vglytics_local_expenses_backup"
    );

    setExpenses([]);

    window.dispatchEvent(
      new Event(
        "expenses-synced"
      )
    );

    window.location.reload();
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="page settings-page">

      {/* ================= HEADER ================= */}

      <header className="page-header">

        <p className="small-label">
          Customize VGlytics
        </p>

        <h1>
          Settings
        </h1>

      </header>

      {/* ================= ACCOUNT ================= */}

      <section className="settings-section">

        <div className="settings-section-title">

          <div className="settings-title-icon">
            <User size={19} />
          </div>

          <div>

            <h2>
              Account
            </h2>

            <p>
              Login is optional. You can use
              VGlytics without an account.
            </p>

          </div>

        </div>

        {user ? (

          <div className="account-card">

            <div className="account-info">

              <div className="account-avatar">
                <User size={20} />
              </div>

              <div>

                <strong>
                  Signed in
                </strong>

                <p>
                  {user.email}
                </p>

              </div>

            </div>

            <button
              type="button"
              className="settings-save-button"
              onClick={handleLogout}
            >

              <LogOut size={17} />

              Logout

            </button>

          </div>

        ) : (

          <div className="account-card">

            <div className="account-info">

              <div className="account-avatar">
                <User size={20} />
              </div>

              <div>

                <strong>
                  Not signed in
                </strong>

                <p>
                  Login to your VGlytics account
                  whenever you want.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="settings-save-button"
              onClick={() => {
                window.location.href =
                  "/auth";
              }}
            >

              <LogIn size={17} />

              Login / Create Account

            </button>

          </div>
        )}

      </section>

      {/* ================= FOOD BUDGET ================= */}

      <section className="settings-section">

        <div className="settings-section-title">

          <div className="settings-title-icon">
            <Wallet size={19} />
          </div>

          <div>

            <h2>
              Monthly Budget
            </h2>

            <p>
              Set how much you want to spend
              on food each month.
            </p>

          </div>

        </div>

        <form
          className="budget-form"
          onSubmit={handleSaveBudget}
        >

          <label>
            Monthly food budget
          </label>

          <div className="settings-amount-input">

            <span>
              ₹
            </span>

            <input
              type="number"
              min="1"
              step="1"
              value={budget}
              onChange={(e) =>
                setBudgetValue(
                  e.target.value
                )
              }
              disabled={savingBudget}
            />

          </div>

          <button
            type="submit"
            className="settings-save-button"
            disabled={savingBudget}
          >

            {saved ? (
              <>
                <Check size={18} />
                Saved
              </>
            ) : savingBudget ? (
              "Saving..."
            ) : (
              "Save Budget"
            )}

          </button>

        </form>

      </section>

      {/* ================= ADDITIONAL EXPENSES ================= */}

      <GeneralExpenseUnlock
        onUnlock={() => {
          window.dispatchEvent(
            new Event(
              "general-expenses-unlocked"
            )
          );
        }}
      />

      {/* ================= VOICE & TALK ================= */}

      <section className="settings-section voice-settings-section">

        <div className="voice-settings-content">

          <div className="voice-settings-icon">
            <Volume2 size={21} />
          </div>

          <div className="voice-settings-text">

            <h2>
              Voice responses
            </h2>

            <p>
              VGlytics will speak answers after
              you use Talk.
            </p>

          </div>

          <button
            type="button"
            className={`voice-toggle ${
              voiceOutput
                ? "active"
                : ""
            }`}
            onClick={
              handleVoiceOutputChange
            }
            aria-label={
              voiceOutput
                ? "Turn voice responses off"
                : "Turn voice responses on"
            }
            aria-pressed={
              voiceOutput
            }
          >

            <span className="voice-toggle-knob" />

          </button>

        </div>

      </section>

      {/* ================= DATA ================= */}

      <section className="settings-section">

        <div className="settings-section-title">

          <div className="settings-title-icon">
            <Database size={19} />
          </div>

          <div>

            <h2>
              Your Data
            </h2>

            <p>
              Your food expenses are stored locally
              on this device.
            </p>

          </div>

        </div>

        <div className="data-info">

          <div>

            <span>
              Recorded food expenses
            </span>

            <strong>
              {expenses.length}
            </strong>

          </div>

          <div>

            <span>
              Total recorded
            </span>

            <strong>
              ₹{totalExpenses}
            </strong>

          </div>

        </div>

        <button
          type="button"
          className="danger-button"
          onClick={clearAllData}
        >
          Clear All Food Expense Data
        </button>

      </section>

      {/* ================= ABOUT ================= */}

      <section className="settings-section about-section">

        <div className="settings-row">

          <div className="settings-row-left">

            <div className="settings-title-icon">
              <Info size={19} />
            </div>

            <div>

              <h2>
                VGlytics
              </h2>

              <p>
                Personal food expense tracker
              </p>

            </div>

          </div>

          <span className="version">
            v7.0
          </span>

        </div>

      </section>

    </div>
  );
}

export default Settings;