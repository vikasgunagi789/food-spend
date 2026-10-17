import { useState, useEffect, useMemo } from "react";

import { useNavigate } from "react-router-dom";


import {
  Plus,
  Coffee,
  Utensils,
  Moon,
  Cookie,
  Settings,
  MessageCircle,
} from "lucide-react";


import {
  isGeneralExpensesUnlocked,
} from "../utils/generalAccess";

import AddExpense from "../components/AddExpense";
import VoiceExpense from "../components/VoiceExpense";
import SmartInsight from "../components/SmartInsight";
import WeeklyMoneyReport from "../components/WeeklyMoneyReport";
import BudgetAlert from "../components/BudgetAlert";

import { getWeeklyReport } from "../utils/weeklyReport";
import { getBudgetAlert } from "../utils/budgetAlerts";
import { getSmartInsight } from "../utils/smartInsights";

import {
  getExpenses,
  getBudget,
} from "../services/expenseService";


// =========================================================
// DATE HELPERS
// =========================================================

function getTodayKey() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getCurrentMonthKey() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}


// =========================================================
// MONEY FORMAT
// =========================================================

function formatMoney(amount) {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN")}`;
}


// =========================================================
// HOME
// =========================================================

function Home() {
  const navigate = useNavigate();

  // =======================================================
  // DATA
  // =======================================================

  const [expenses, setExpenses] =
    useState([]);

  const [budget, setBudget] =
    useState(getBudget());

  const [showAddExpense, setShowAddExpense] =
    useState(false);

  const [showVoiceExpense, setShowVoiceExpense] =
    useState(false);


  // =======================================================
  // PREMIUM STATUS
  // =======================================================

  const [premiumUnlocked, setPremiumUnlocked] =
    useState(() =>
      isGeneralExpensesUnlocked()
    );


  // =======================================================
  // REFRESH DATA
  // =======================================================

  function refreshData() {
    setExpenses(
      getExpenses()
    );

    setBudget(
      getBudget()
    );

    setPremiumUnlocked(
      isGeneralExpensesUnlocked()
    );
  }


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
  refreshData();

  function handleFocus() {
    refreshData();
  }

  function handleExpensesSynced() {
    console.log(
      "VGlytics: Home refreshing after Firebase sync..."
    );

    refreshData();
  }

  function handlePremiumUnlocked() {
    setPremiumUnlocked(true);
  }

  function handlePremiumLocked() {
    setPremiumUnlocked(false);
  }

  // Existing refresh
  window.addEventListener(
    "focus",
    handleFocus
  );

  // Firebase sync refresh
  window.addEventListener(
    "expenses-synced",
    handleExpensesSynced
  );

  window.addEventListener(
    "general-expenses-unlocked",
    handlePremiumUnlocked
  );

  window.addEventListener(
    "general-expenses-locked",
    handlePremiumLocked
  );

  return () => {
    window.removeEventListener(
      "focus",
      handleFocus
    );

    window.removeEventListener(
      "expenses-synced",
      handleExpensesSynced
    );

    window.removeEventListener(
      "general-expenses-unlocked",
      handlePremiumUnlocked
    );

    window.removeEventListener(
      "general-expenses-locked",
      handlePremiumLocked
    );
  };
}, []);


  // =======================================================
  // DATE
  // =======================================================

  const today =
    getTodayKey();

  const currentMonth =
    getCurrentMonthKey();


  // =======================================================
  // TODAY
  // =======================================================

  const todayExpenses =
    expenses.filter(
      (expense) =>
        expense.date === today
    );


  const todayTotal =
    todayExpenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    );


  // =======================================================
  // THIS MONTH
  // =======================================================

  const monthExpenses =
    expenses.filter(
      (expense) =>
        String(
          expense.date
        ).slice(0, 7) ===
        currentMonth
    );


  const monthlyTotal =
    monthExpenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    );


  // =======================================================
  // BUDGET ALERT
  // =======================================================

  const budgetAlert =
    useMemo(
      () =>
        getBudgetAlert(
          monthlyTotal,
          budget
        ),
      [
        monthlyTotal,
        budget,
      ]
    );


  // =======================================================
  // BUDGET
  // =======================================================

  const remaining =
    Math.max(
      budget - monthlyTotal,
      0
    );


  const isOverBudget =
    monthlyTotal > budget;


  const percentage =
    budget > 0
      ? Math.min(
          Math.round(
            (monthlyTotal /
              budget) *
              100
          ),
          100
        )
      : 0;


  const overBudgetAmount =
    monthlyTotal > budget
      ? monthlyTotal - budget
      : 0;


  // =======================================================
  // SMART SPENDING ANALYSIS
  // =======================================================

  const currentDate =
    new Date();


  const lastDayOfMonth =
    new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();


  const currentDay =
    currentDate.getDate();


  const daysRemaining =
    lastDayOfMonth -
    currentDay +
    1;


  // Average spending per day

  const averageDailySpending =
    currentDay > 0
      ? monthlyTotal /
        currentDay
      : 0;


  // Recommended spending per remaining day

  const dailyRecommended =
    daysRemaining > 0 &&
    remaining > 0
      ? remaining /
        daysRemaining
      : 0;


  // Predicted monthly spending

  const predictedMonthlySpending =
    currentDay > 0
      ? (monthlyTotal /
          currentDay) *
        lastDayOfMonth
      : 0;


  const willExceedBudget =
    predictedMonthlySpending >
    budget;


  // =======================================================
  // SMART DAILY INSIGHT
  // =======================================================

  const smartInsight =
    useMemo(
      () =>
        getSmartInsight(
          expenses,
          budget
        ),
      [
        expenses,
        budget,
      ]
    );


  // =======================================================
  // WEEKLY REPORT
  // =======================================================

  const weeklyReport =
    useMemo(
      () =>
        getWeeklyReport(
          expenses
        ),
      [expenses]
    );


  // =======================================================
  // CATEGORY TOTAL
  // =======================================================

  const categoryTotal =
    (category) => {
      return todayExpenses
        .filter(
          (expense) =>
            expense.category ===
            category
        )
        .reduce(
          (
            total,
            expense
          ) =>
            total +
            Number(
              expense.amount || 0
            ),
          0
        );
    };


  // =======================================================
  // EXPENSE ADDED
  // =======================================================

  function handleExpenseAdded() {
    setShowAddExpense(false);

    refreshData();
  }


  // =======================================================
  // VOICE RESULT
  // =======================================================

  function handleVoiceResult(
    text
  ) {
    console.log(
      "User said:",
      text
    );

    setShowVoiceExpense(
      false
    );

    window.dispatchEvent(
      new Event("focus")
    );
  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="page">


      {/* =================================================
          HEADER
          ================================================= */}

      
<header className="top-header">
  <div>
    <p className="greeting">
      Good Evening
    </p>

    <h1>
      VGlytics
    </h1>
  </div>

  <div className="top-header-actions">
    <button
      type="button"
      className="top-chat-button"
      onClick={() => navigate("/smart-chat")}
      aria-label="Open Smart Chat"
      title="Smart Chat"
    >
      <MessageCircle size={22} />
      <span>Smart Chat</span>
    </button>

    {premiumUnlocked && (
      <button
        type="button"
        className="top-settings-button"
        onClick={() => navigate("/settings")}
        aria-label="Settings"
      >
        <Settings size={22} />
      </button>
    )}
  </div>
</header>


      {/* =================================================
          TODAY'S SPENDING
          ================================================= */}

      <section className="spending-card">

        <p>
          Today's Spending
        </p>

        <h2>
          {formatMoney(
            todayTotal
          )}
        </h2>

        <span>
          {new Date().toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </span>

      </section>


      {/* =================================================
          TODAY'S CATEGORIES
          ================================================= */}

      <section className="section">

        <div className="section-header">

          <h3>
            Today
          </h3>

          <span>
            {todayExpenses.length}{" "}

            {todayExpenses.length === 1
              ? "expense"
              : "expenses"}
          </span>

        </div>


        <div className="category-grid">

          <CategoryCard
            icon={
              <Coffee size={20} />
            }
            name="Breakfast"
            amount={categoryTotal(
              "Breakfast"
            )}
          />


          <CategoryCard
            icon={
              <Utensils size={20} />
            }
            name="Lunch"
            amount={categoryTotal(
              "Lunch"
            )}
          />


          <CategoryCard
            icon={
              <Moon size={20} />
            }
            name="Dinner"
            amount={categoryTotal(
              "Dinner"
            )}
          />


          <CategoryCard
            icon={
              <Cookie size={20} />
            }
            name="Snacks"
            amount={categoryTotal(
              "Snacks"
            )}
          />

        </div>

      </section>


      {/* =================================================
          MONTHLY BUDGET
          ================================================= */}

      <section className="monthly-card">

        <div className="section-header">

          <div>

            <h3>
              Monthly Budget
            </h3>

            <span>
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </span>

          </div>


          <strong className="budget-percentage">
            {percentage}%
          </strong>

        </div>


        {/* MONTHLY SPENDING */}

        <div className="monthly-amount">

          {formatMoney(
            monthlyTotal
          )}

        </div>


        {/* BUDGET INFORMATION */}

        <div className="budget-info">

          <span>
            {formatMoney(
              budget
            )}{" "}
            budget
          </span>


          <span>

            {isOverBudget
              ? "Over budget"
              : `${formatMoney(
                  remaining
                )} left`}

          </span>

        </div>


        {/* PROGRESS BAR */}

        <div className="progress-bar">

          <div
            className={`progress ${
              isOverBudget
                ? "progress-danger"
                : ""
            }`}
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>


        {/* BUDGET MESSAGE */}

        <div
          className={
            isOverBudget
              ? "budget-message danger-text"
              : "budget-message"
          }
        >

          {isOverBudget ? (

            <>
              You've exceeded your
              budget by{" "}

              <strong>
                {formatMoney(
                  overBudgetAmount
                )}
              </strong>
            </>

          ) : (

            <>
              <strong>
                {formatMoney(
                  remaining
                )}
              </strong>{" "}
              remaining for this
              month
            </>

          )}

        </div>

      </section>


      {/* =================================================
          SMART BUDGET ALERT
          ================================================= */}

      <BudgetAlert
        alert={budgetAlert}
      />


      {/* =================================================
          SMART DAILY INSIGHT
          ================================================= */}

      <SmartInsight
        insight={smartInsight}
        onViewStatistics={() =>
          navigate(
            "/statistics"
          )
        }
      />


      {/* =================================================
          SMART SPENDING
          ================================================= */}

      <section className="smart-spending-card">

        <div className="smart-card-header">

          <div>

            <p>
              Smart Spending
            </p>

            <h3>
              Your daily guide
            </h3>

          </div>


          <div className="smart-card-badge">

            {willExceedBudget
              ? "Watch"
              : "On Track"}

          </div>

        </div>


        {/* SMART STATS */}

        <div className="smart-stats">

          <div className="smart-stat">

            <span>
              Daily average
            </span>

            <strong>
              {formatMoney(
                averageDailySpending
              )}
            </strong>

          </div>


          <div className="smart-stat">

            <span>
              Recommended / day
            </span>

            <strong>
              {formatMoney(
                dailyRecommended
              )}
            </strong>

          </div>


          <div className="smart-stat">

            <span>
              Days remaining
            </span>

            <strong>
              {daysRemaining}
            </strong>

          </div>

        </div>


        {/* SMART MESSAGE */}

        <div
          className={
            willExceedBudget
              ? "smart-message smart-warning"
              : "smart-message smart-success"
          }
        >

          {remaining <= 0 ? (

            <>
              Your monthly budget has
              been reached. Try to keep
              additional spending low.
            </>

          ) : willExceedBudget ? (

            <>
              At your current spending
              rate, you may exceed your
              monthly budget. Try keeping
              upcoming spending around{" "}

              <strong>
                {formatMoney(
                  dailyRecommended
                )}
              </strong>{" "}

              per day.
            </>

          ) : (

            <>
              You're currently on track.
              You can spend around{" "}

              <strong>
                {formatMoney(
                  dailyRecommended
                )}
              </strong>{" "}

              per day for the rest of
              the month.
            </>

          )}

        </div>

      </section>


      {/* =================================================
          WEEKLY MONEY REPORT
          ================================================= */}

      <WeeklyMoneyReport
        report={weeklyReport}
      />


      {/* =================================================
          EXPENSE ACTIONS
          ================================================= */}

      <div className="expense-actions">

        <button
          type="button"
          className="add-expense"
          onClick={() =>
            setShowAddExpense(
              true
            )
          }
        >

          <Plus size={23} />

          Add Expense

        </button>

      </div>


      {/* =================================================
          ADD EXPENSE MODAL
          ================================================= */}

      {showAddExpense && (

        <AddExpense
          onClose={() =>
            setShowAddExpense(
              false
            )
          }
          onExpenseAdded={
            handleExpenseAdded
          }
        />

      )}


      {/* =================================================
          VOICE EXPENSE MODAL
          ================================================= */}

      {showVoiceExpense && (

        <VoiceExpense
          onClose={() =>
            setShowVoiceExpense(
              false
            )
          }
          onResult={
            handleVoiceResult
          }
        />

      )}

    </div>
  );
}


// =========================================================
// CATEGORY CARD
// =========================================================

function CategoryCard({
  icon,
  name,
  amount,
}) {
  return (

    <div className="category-card">

      <div className="category-icon">
        {icon}
      </div>

      <div>

        <p>
          {name}
        </p>

        <strong>
          {formatMoney(
            amount
          )}
        </strong>

      </div>

    </div>

  );
}


export default Home;