import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  addExpense,
  updateExpense,
} from "../services/expenseService";

import {
  addCloudExpense,
  updateCloudExpense,
} from "../services/cloudExpenseService";

import { auth } from "../lib/firebase";

const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Drinks",
  "Other",
];

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function AddExpense({
  onClose,
  onExpenseAdded,
  onExpenseUpdated,
  editingExpense = null,
}) {
  const isEditing =
    Boolean(editingExpense);

  const [itemName, setItemName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [date, setDate] =
    useState(getLocalDate());

  const [note, setNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (editingExpense) {
      setItemName(
        editingExpense.itemName || ""
      );

      setAmount(
        String(
          editingExpense.amount || ""
        )
      );

      setCategory(
        editingExpense.category || ""
      );

      setDate(
        editingExpense.date ||
          getLocalDate()
      );

      setNote(
        editingExpense.note || ""
      );
    } else {
      setItemName("");
      setAmount("");
      setCategory("");
      setDate(getLocalDate());
      setNote("");
    }
  }, [editingExpense]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) {
      return;
    }

    if (!itemName.trim()) {
      alert(
        "Please enter the food item."
      );
      return;
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      alert(
        "Please enter a valid amount."
      );
      return;
    }

    if (!category) {
      alert(
        "Please select a category."
      );
      return;
    }

    const expenseData = {
      itemName: itemName.trim(),
      amount: Number(amount),
      category,
      date,
      note: note.trim(),
    };

    const currentUser =
      auth.currentUser;

    try {
      setSaving(true);

      // =====================================================
      // EDIT EXISTING EXPENSE
      // =====================================================

      if (isEditing) {
        updateExpense(
          editingExpense.id,
          expenseData
        );

        if (currentUser) {
          await updateCloudExpense(
            currentUser,
            editingExpense.id,
            expenseData
          );
        }

        window.dispatchEvent(
          new Event("expenses-synced")
        );

        if (onExpenseUpdated) {
          onExpenseUpdated();
        }

        onClose();
        return;
      }

      // =====================================================
      // ADD NEW EXPENSE
      // =====================================================

      const expenseId =
        crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`;

      const expenseWithId = {
        ...expenseData,
        id: expenseId,
      };

      // Save locally first.
      const newExpense =
        addExpense(expenseWithId);

      // If logged in, also save to Firebase.
      if (currentUser) {
        await addCloudExpense(
          currentUser,
          newExpense
        );
      }

      // Tell Home / History / Statistics
      // that the expense data changed.
      window.dispatchEvent(
        new Event("expenses-synced")
      );

      if (onExpenseAdded) {
        onExpenseAdded();
      }

      onClose();
    } catch (error) {
      console.error(
        "Unable to save expense:",
        error
      );

      alert(
        "The expense was saved on this device, but Firebase could not be updated. Please check your internet connection and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="expense-modal">

        <div className="modal-header">

          <div>
            <p className="small-label">
              VGlytics
            </p>

            <h2>
              {isEditing
                ? "Edit Expense"
                : "Add Expense"}
            </h2>
          </div>

          <button
            className="close-button"
            onClick={onClose}
            type="button"
            aria-label="Close"
            disabled={saving}
          >
            <X size={21} />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>
              Food item
            </label>

            <input
              type="text"
              placeholder="e.g. Idli + Vada"
              value={itemName}
              onChange={(e) =>
                setItemName(
                  e.target.value
                )
              }
              autoFocus
              disabled={saving}
            />

          </div>

          <div className="form-group">

            <label>
              Amount
            </label>

            <div className="amount-input">

              <span>₹</span>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                disabled={saving}
              />

            </div>

          </div>

          <div className="form-group">

            <label>
              Category
            </label>

            <div className="category-selector">

              {categories.map(
                (item) => (
                  <button
                    type="button"
                    key={item}
                    className={
                      category === item
                        ? "category-option selected"
                        : "category-option"
                    }
                    onClick={() =>
                      setCategory(item)
                    }
                    disabled={saving}
                  >
                    {item}
                  </button>
                )
              )}

            </div>

          </div>

          <div className="form-group">

            <label>
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(
                  e.target.value
                )
              }
              disabled={saving}
            />

          </div>

          <div className="form-group">

            <label>
              Note{" "}
              <span>
                (optional)
              </span>
            </label>

            <textarea
              placeholder="Add a note..."
              value={note}
              onChange={(e) =>
                setNote(
                  e.target.value
                )
              }
              rows="3"
              disabled={saving}
            />

          </div>

          <button
            type="submit"
            className="save-expense"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Add Expense"}
          </button>

          <div className="space"></div>

        </form>

      </div>
    </div>
  );
}

export default AddExpense;