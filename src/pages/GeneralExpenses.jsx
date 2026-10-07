import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getGeneralExpenses,
  addGeneralExpense,
  deleteGeneralExpense,
} from "../services/generalExpenseService";

import {
  getGeneralTotalSpent,
} from "../utils/generalCalculations";

import {
  isGeneralExpensesUnlocked,
} from "../utils/generalAccess";

const CATEGORIES = [
  "Transportation",
  "Stationery",
  "Mobile Recharge",
  "Education",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

function formatMoney(amount) {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function getToday() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  return new Date(
    dateString
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function GeneralExpenses() {
  const navigate = useNavigate();

  const [expenses, setExpenses] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [itemName, setItemName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState("Transportation");

  const [date, setDate] =
    useState(getToday());

  const [note, setNote] =
    useState("");

  function loadExpenses() {
    setExpenses(
      getGeneralExpenses()
    );
  }

  useEffect(() => {
    if (
      !isGeneralExpensesUnlocked()
    ) {
      navigate(
        "/settings",
        { replace: true }
      );

      return;
    }

    loadExpenses();

    function refresh() {
      loadExpenses();
    }

    function handleLock() {
      navigate(
        "/settings",
        { replace: true }
      );
    }

    window.addEventListener(
      "generalExpensesUpdated",
      refresh
    );

    window.addEventListener(
      "general-expenses-locked",
      handleLock
    );

    return () => {
      window.removeEventListener(
        "generalExpensesUpdated",
        refresh
      );

      window.removeEventListener(
        "general-expenses-locked",
        handleLock
      );
    };
  }, [navigate]);

  const totalSpent = useMemo(
    () =>
      getGeneralTotalSpent(
        expenses
      ),
    [expenses]
  );

  function resetForm() {
    setItemName("");
    setAmount("");
    setCategory(
      "Transportation"
    );
    setDate(getToday());
    setNote("");
  }

  function handleAddExpense(
    event
  ) {
    event.preventDefault();

    const cleanName =
      itemName.trim();

    const numericAmount =
      Number(amount);

    if (!cleanName) {
      alert(
        "Please enter the expense name."
      );

      return;
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      alert(
        "Please enter a valid amount."
      );

      return;
    }

    if (!date) {
      alert(
        "Please select a date."
      );

      return;
    }

    addGeneralExpense({
      itemName: cleanName,
      amount: numericAmount,
      category,
      date,
      note,
    });

    loadExpenses();

    resetForm();

    setShowForm(false);
  }

  function handleDelete(id) {
    const confirmed =
      window.confirm(
        "Delete this general expense?"
      );

    if (!confirmed) {
      return;
    }

    deleteGeneralExpense(id);

    loadExpenses();
  }

  return (
    <div className="page general-expenses-page">

      <header className="page-header">

        <div>

          <p className="page-kicker">
            VGlytics Premium
          </p>

          <h1>
            General Expenses
          </h1>

          <p>
            Keep your non-food spending
            separate from food expenses.
          </p>

        </div>

        <div className="general-page-icon">
          <WalletCards size={24} />
        </div>

      </header>


      <section className="general-total-card">

        <div>

          <span>
            Total General Spending
          </span>

          <strong>
            {formatMoney(
              totalSpent
            )}
          </strong>

          <small>
            All recorded general expenses
          </small>

        </div>

        <div className="general-total-icon">
          <WalletCards size={22} />
        </div>

      </section>


      <button
        type="button"
        className="general-add-button"
        onClick={() => {
          setShowForm(true);
        }}
      >
        <Plus size={20} />

        Add General Expense
      </button>


      {showForm && (
        <div className="general-form-card">

          <div className="general-form-header">

            <div>
              <h2>
                Add General Expense
              </h2>

              <p>
                Record a non-food expense.
              </p>
            </div>

            <button
              type="button"
              className="general-close-button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              <X size={20} />
            </button>

          </div>


          <form
            onSubmit={
              handleAddExpense
            }
          >

            <div className="general-form-group">

              <label>
                Expense name
              </label>

              <input
                type="text"
                value={itemName}
                onChange={(event) =>
                  setItemName(
                    event.target.value
                  )
                }
                placeholder="Bus ticket, recharge, notebook..."
              />

            </div>


            <div className="general-form-row">

              <div className="general-form-group">

                <label>
                  Amount
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="₹0"
                />

              </div>


              <div className="general-form-group">

                <label>
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                >
                  {CATEGORIES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>


            <div className="general-form-group">

              <label>
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="general-form-group">

              <label>
                Note
                <span>
                  Optional
                </span>
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                placeholder="Add a note..."
                rows="3"
              />

            </div>


            <button
              type="submit"
              className="general-save-button"
            >
              <Plus size={19} />

              Save Expense
            </button>

          </form>

        </div>
      )}


      <section className="general-list-section">

        <div className="general-list-header">

          <div>
            <h2>
              Recent Expenses
            </h2>

            <p>
              {expenses.length}{" "}
              {expenses.length === 1
                ? "expense"
                : "expenses"}{" "}
              recorded
            </p>
          </div>

        </div>


        {expenses.length === 0 ? (
          <div className="general-empty-state">

            <WalletCards size={32} />

            <h3>
              No general expenses yet
            </h3>

            <p>
              Add transportation,
              recharge, stationery or
              other expenses here.
            </p>

          </div>
        ) : (
          <div className="general-expense-list">

            {[...expenses]
              .sort(
                (a, b) =>
                  new Date(
                    b.date
                  ) -
                  new Date(
                    a.date
                  )
              )
              .map(
                (expense) => (
                  <div
                    className="general-expense-item"
                    key={
                      expense.id
                    }
                  >

                    <div className="general-expense-main">

                      <div className="general-expense-category">
                        {expense.category}
                      </div>

                      <h3>
                        {
                          expense.itemName
                        }
                      </h3>

                      <p>
                        {formatDate(
                          expense.date
                        )}

                        {expense.note
                          ? ` • ${expense.note}`
                          : ""}
                      </p>

                    </div>


                    <div className="general-expense-right">

                      <strong>
                        {formatMoney(
                          expense.amount
                        )}
                      </strong>

                      <button
                        type="button"
                        className="general-delete-button"
                        onClick={() =>
                          handleDelete(
                            expense.id
                          )
                        }
                        aria-label="Delete expense"
                      >
                        <Trash2
                          size={17}
                        />
                      </button>

                    </div>

                  </div>
                )
              )}

          </div>
        )}

      </section>

    </div>
  );
}