import { useEffect, useMemo, useState } from "react";
import { Filter, X } from "lucide-react";

import ExpenseCard from "../components/ExpenseCard";
import AddExpense from "../components/AddExpense";

import {
  getExpenses,
  deleteExpense,
} from "../services/expenseService";

import { auth } from "../lib/firebase";

import {
  deleteCloudExpense,
} from "../services/cloudExpenseService";

const categories = [
  "All",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Drinks",
  "Other",
];

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function History() {
  const [expenses, setExpenses] = useState([]);
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [showFilters, setShowFilters] =
    useState(false);
  const [editingExpense, setEditingExpense] =
    useState(null);

  function loadExpenses() {
    setExpenses(getExpenses());
  }

  useEffect(() => {
  loadExpenses();

  function handleExpensesSynced() {
    console.log(
      "VGlytics: History refreshing after Firebase sync..."
    );

    loadExpenses();
  }

  window.addEventListener(
    "expenses-synced",
    handleExpensesSynced
  );

  window.addEventListener(
    "focus",
    loadExpenses
  );

  return () => {
    window.removeEventListener(
      "expenses-synced",
      handleExpensesSynced
    );

    window.removeEventListener(
      "focus",
      loadExpenses
    );
  };
}, []);

  async function handleDelete(id) {
  const shouldDelete = window.confirm(
    "Delete this expense?"
  );

  if (!shouldDelete) {
    return;
  }

  try {
    // Delete locally
    deleteExpense(id);

    // Delete from Firebase if logged in
    const currentUser = auth.currentUser;

    if (currentUser) {
      await deleteCloudExpense(
        currentUser,
        id
      );
    }

    // Refresh History
    loadExpenses();

    // Tell other pages
    window.dispatchEvent(
      new Event("expenses-synced")
    );
  } catch (error) {
    console.error(
      "Unable to delete cloud expense:",
      error
    );

    alert(
      "The expense was deleted on this device, but Firebase could not be updated."
    );
  }
}

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === "All") {
      return expenses;
    }

    return expenses.filter(
      (expense) =>
        expense.category === selectedCategory
    );
  }, [expenses, selectedCategory]);

  const groupedExpenses = useMemo(() => {
    const groups = {};

    filteredExpenses.forEach((expense) => {
      if (!groups[expense.date]) {
        groups[expense.date] = [];
      }

      groups[expense.date].push(expense);
    });

    return Object.entries(groups).sort(
      ([dateA], [dateB]) =>
        new Date(dateB) - new Date(dateA)
    );
  }, [filteredExpenses]);

  const totalSpent = filteredExpenses.reduce(
    (total, expense) =>
      total + Number(expense.amount),
    0
  );

  return (
    <div className="page history-page">

      <header className="page-header history-header">
        <div>
          <p className="small-label">
            Your food expenses
          </p>

          <h1>History</h1>
        </div>

        <button
          className={
            showFilters
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setShowFilters(!showFilters)
          }
          type="button"
        >
          <Filter size={18} />
          Filter
        </button>
      </header>

      {/* SUMMARY */}

      <section className="history-summary">
        <div>
          <p>Total recorded</p>
          <strong>
            ₹{totalSpent}
          </strong>
        </div>

        <div>
          <p>Expenses</p>
          <strong>
            {filteredExpenses.length}
          </strong>
        </div>
      </section>

      {/* FILTERS */}

      {showFilters && (
        <section className="filter-panel">

          <div className="filter-panel-header">
            <h3>Category</h3>

            <button
              type="button"
              onClick={() =>
                setSelectedCategory("All")
              }
              className="clear-filter"
            >
              Clear
            </button>
          </div>

          <div className="filter-options">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "filter-option selected"
                    : "filter-option"
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            ))}
          </div>

        </section>
      )}

      {/* ACTIVE FILTER */}

      {selectedCategory !== "All" && (
        <div className="active-filter">
          <span>
            Showing: {selectedCategory}
          </span>

          <button
            type="button"
            onClick={() =>
              setSelectedCategory("All")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* EXPENSE LIST */}

      {groupedExpenses.length === 0 ? (
        <div className="empty-state">

          <div className="empty-icon">
            🍽️
          </div>

          <h2>
            {expenses.length === 0
              ? "No expenses yet"
              : "No matching expenses"}
          </h2>

          <p>
            {expenses.length === 0
              ? "Start recording your food expenses and they will appear here."
              : "Try selecting a different category."}
          </p>

        </div>
      ) : (
        <div className="history-list">

          {groupedExpenses.map(
            ([date, dayExpenses]) => {

              const dayTotal =
                dayExpenses.reduce(
                  (total, expense) =>
                    total +
                    Number(expense.amount),
                  0
                );

              return (
                <section
                  className="history-day"
                  key={date}
                >

                  <div className="history-day-header">

                    <div>
                      <p>
                        {formatDate(date)}
                      </p>

                      <span>
                        {dayExpenses.length}{" "}
                        {dayExpenses.length === 1
                          ? "expense"
                          : "expenses"}
                      </span>
                    </div>

                    <strong>
                      ₹{dayTotal}
                    </strong>

                  </div>

                  <div className="day-expenses">
                    {dayExpenses.map(
                      (expense) => (
                        <ExpenseCard
                          key={expense.id}
                          expense={expense}
                          onEdit={
                            setEditingExpense
                          }
                          onDelete={
                            handleDelete
                          }
                        />
                      )
                    )}
                  </div>

                </section>
              );
            }
          )}

        </div>
      )}

      {/* EDIT MODAL */}

      {editingExpense && (
        <AddExpense
          editingExpense={editingExpense}
          onClose={() =>
            setEditingExpense(null)
          }
          onExpenseUpdated={() => {
            loadExpenses();
            setEditingExpense(null);
          }}
        />
      )}

    </div>
  );
}

export default History;