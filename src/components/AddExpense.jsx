
import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

import {
  addExpense,
  updateExpense,
} from "../services/expenseService";

import {
  addCloudExpense,
  updateCloudExpense,
} from "../services/cloudExpenseService";

import {
  getIngredientPurchases,
  getIngredientUsages,
  recordIngredientUsage,
} from "../services/ingredientService";

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
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function AddExpense({
  onClose,
  onExpenseAdded,
  onExpenseUpdated,
  editingExpense = null,
}) {
  const isEditing = Boolean(editingExpense);

  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [ingredientPurchases, setIngredientPurchases] =
    useState([]);

  const [selectedIngredients, setSelectedIngredients] =
    useState([]);

  // =========================================
  // LOAD INGREDIENTS
  // =========================================

  useEffect(() => {
    function loadIngredients() {
      setIngredientPurchases(
        getIngredientPurchases().filter(
          (item) => item.status === "active"
        )
      );
    }

    loadIngredients();

    window.addEventListener(
      "ingredientsUpdated",
      loadIngredients
    );

    return () => {
      window.removeEventListener(
        "ingredientsUpdated",
        loadIngredients
      );
    };
  }, []);

  // =========================================
  // LOAD EXPENSE DATA
  // =========================================

  useEffect(() => {
    if (editingExpense) {
      setItemName(editingExpense.itemName || "");
      setAmount(String(editingExpense.amount || ""));
      setCategory(editingExpense.category || "");
      setDate(editingExpense.date || getLocalDate());
      setNote(editingExpense.note || "");
      setSelectedIngredients([]);
    } else {
      setItemName("");
      setAmount("");
      setCategory("");
      setDate(getLocalDate());
      setNote("");
      setSelectedIngredients([]);
    }
  }, [editingExpense]);

  // =========================================
  // ADD INGREDIENT
  // =========================================

  function addIngredientRow() {
    setSelectedIngredients((previous) => [
      ...previous,
      {
        purchaseId: "",
      },
    ]);
  }

  // =========================================
  // UPDATE INGREDIENT
  // =========================================

  function updateIngredientRow(index, purchaseId) {
    setSelectedIngredients((previous) =>
      previous.map((item, i) =>
        i === index
          ? { ...item, purchaseId }
          : item
      )
    );
  }

  // =========================================
  // REMOVE INGREDIENT
  // =========================================

  function removeIngredientRow(index) {
    setSelectedIngredients((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  // =========================================
  // CALCULATE ESTIMATED COST
  // =========================================

  function getIngredientCost(purchaseId) {
    const purchase = ingredientPurchases.find(
      (item) => item.id === purchaseId
    );

    if (!purchase) return 0;

    const usages = getIngredientUsages().filter(
      (usage) => usage.purchaseId === purchaseId
    );

    const nextUsageCount = usages.length + 1;

    return (
      Number(purchase.purchasePrice) /
      nextUsageCount
    );
  }

  // =========================================
  // TOTAL ESTIMATED INGREDIENT COST
  // =========================================

  const totalIngredientCost = selectedIngredients.reduce(
    (total, ingredient) => {
      if (!ingredient.purchaseId) return total;

      return (
        total +
        getIngredientCost(ingredient.purchaseId)
      );
    },
    0
  );

  // =========================================
  // SUBMIT EXPENSE
  // =========================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    if (!itemName.trim()) {
      alert("Please enter the food item.");
      return;
    }

    const hasAmount = amount.trim() !== "" && Number(amount) > 0;
const hasIngredients = selectedIngredients.some(
  (ingredient) => ingredient.purchaseId
);

if (!hasAmount && !hasIngredients) {
  alert("Enter an amount or select at least one ingredient.");
  return;
}

if (amount.trim() !== "" && Number(amount) <= 0) {
  alert("Please enter a valid amount.");
  return;
}

    if (!category) {
      alert("Please select a category.");
      return;
    }

    // Validate ingredient selection
    if (!isEditing) {
      const selectedIds = selectedIngredients
        .map((item) => item.purchaseId)
        .filter(Boolean);

      if (selectedIds.length !== selectedIngredients.length) {
        alert("Please select all added ingredients.");
        return;
      }

      if (new Set(selectedIds).size !== selectedIds.length) {
        alert("Please select each ingredient purchase only once.");
        return;
      }

      const currentPurchases = getIngredientPurchases();

      for (const purchaseId of selectedIds) {
        const purchase = currentPurchases.find(
          (item) => item.id === purchaseId
        );

        if (!purchase || purchase.status !== "active") {
          alert(
            "An ingredient is no longer available. Please refresh your selection."
          );
          return;
        }
      }
    }

    const expenseData = {
      itemName: itemName.trim(),
      amount: hasAmount ? Number(amount) : 0,
      category,
      date,
      note: note.trim(),
    };

    const currentUser = auth.currentUser;

    try {
      setSaving(true);

      // =========================================
      // EDIT EXISTING EXPENSE
      // =========================================

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

      // =========================================
      // ADD NEW EXPENSE
      // =========================================

      const expenseId =
        crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`;

      const expenseWithId = {
        ...expenseData,
        id: expenseId,
      };

      // Save locally first
      const newExpense = addExpense(expenseWithId);

      // =========================================
      // RECORD INGREDIENT USAGE
      // =========================================

      for (const ingredient of selectedIngredients) {
        recordIngredientUsage({
          purchaseId: ingredient.purchaseId,
          expenseId,
          foodName: itemName.trim(),
          date,
        });
      }

      // =========================================
      // SAVE TO FIREBASE
      // =========================================

      if (currentUser) {
        await addCloudExpense(
          currentUser,
          newExpense
        );
      }

      // =========================================
      // NOTIFY OTHER PAGES
      // =========================================

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
        error.message ||
          "Unable to save expense. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="expense-modal">

        <div className="modal-header">
          <div>
            <p className="small-label">VGlytics</p>

            <h2>
              {isEditing ? "Edit Expense" : "Add Expense"}
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

        <form onSubmit={handleSubmit}>

          {/* FOOD ITEM */}

          <div className="form-group">
            <label>Food item</label>

            <input
              type="text"
              placeholder="e.g. Idli + Vada"
              value={itemName}
              onChange={(e) =>
                setItemName(e.target.value)
              }
              autoFocus
              disabled={saving}
            />
          </div>

          {/* AMOUNT */}

          <div className="form-group">
            <label>Amount Paid (Optional)</label>

            <div className="amount-input">
              <span>₹</span>

              <input
  type="number"
  min="1"
  step="0.01"
  placeholder="Enter amount (optional)"
  value={amount}
  onChange={(e) =>
    setAmount(e.target.value)
  }
  disabled={saving}
/>
            </div>
          </div>

          {/* CATEGORY */}

          <div className="form-group">
            <label>Category</label>

            <div className="category-selector">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    category === item
                      ? "category-option selected"
                      : "category-option"
                  }
                  onClick={() => setCategory(item)}
                  disabled={saving}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* INGREDIENTS */}

          {!isEditing && (
            <div className="form-group ingredient-expense-section">

              <div className="ingredient-expense-heading">
                <div>
                  <label>Ingredients Used</label>

                  <p>
                    Select ingredients to share their purchase cost.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-expense-ingredient"
                  onClick={addIngredientRow}
                  disabled={saving}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {selectedIngredients.length === 0 && (
                <p className="no-expense-ingredients">
                  No ingredients selected. This section is optional.
                </p>
              )}

              {selectedIngredients.map((ingredient, index) => {
                const purchase = ingredientPurchases.find(
                  (item) => item.id === ingredient.purchaseId
                );

                return (
                  <div
                    className="expense-ingredient-row"
                    key={index}
                  >
                    <div className="ingredient-quantity-row">
                      <div className="form-group">
                        <label>Select Ingredient</label>

                        <select
                          value={ingredient.purchaseId}
                          onChange={(e) =>
                            updateIngredientRow(
                              index,
                              e.target.value
                            )
                          }
                          disabled={saving}
                        >
                          <option value="">
                            Choose ingredient
                          </option>

                          {ingredientPurchases.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                              disabled={selectedIngredients.some(
                                (selected, selectedIndex) =>
                                  selectedIndex !== index &&
                                  selected.purchaseId === item.id
                              )}
                            >
                              {item.name} — ₹
                              {Number(item.purchasePrice).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        className="remove-expense-ingredient"
                        onClick={() =>
                          removeIngredientRow(index)
                        }
                        disabled={saving}
                        aria-label="Remove ingredient"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {purchase && (
                      <div className="ingredient-cost-preview">
                        <span>
                          {purchase.name} allocation
                        </span>

                        <strong>
                          ₹
                          {getIngredientCost(
                            purchase.id
                          ).toFixed(2)}
                        </strong>
                      </div>
                    )}
                  </div>
                );
              })}

              {ingredientPurchases.length === 0 && (
                <p className="no-expense-ingredients">
                  No active ingredients found. Add an ingredient purchase first.
                </p>
              )}

              {selectedIngredients.some(
                (item) => item.purchaseId
              ) && (
                <div className="ingredient-total-cost">
                  <span>Estimated ingredient cost</span>

                  <strong>
                    ₹{totalIngredientCost.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <p className="no-expense-ingredients">
              Ingredient selections are not changed when editing an existing expense.
            </p>
          )}

          {/* DATE */}

          <div className="form-group">
            <label>Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              disabled={saving}
            />
          </div>

          {/* NOTE */}

          <div className="form-group">
            <label>
              Note <span>(optional)</span>
            </label>

            <textarea
              placeholder="Add a note..."
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              rows="3"
              disabled={saving}
            />
          </div>

          {/* SAVE */}

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
