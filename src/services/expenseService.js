const STORAGE_KEY = "foodspend_expenses";
const BUDGET_KEY = "foodspend_monthly_budget";
const LOCAL_BACKUP_KEY = "vglytics_local_expenses_backup";

// =====================================================
// GET EXPENSES
// =====================================================

export function getExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read expenses:", error);
    return [];
  }
}

// =====================================================
// ADD EXPENSE
// =====================================================

export function addExpense(expense) {
  const expenses = getExpenses();

  const newExpense = {
    id:
      expense.id ||
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`,

    itemName: expense.itemName || "",

    amount: Number(expense.amount || 0),

    category: expense.category || "Other",

    date: expense.date || "",

    note: expense.note || "",

    createdAt:
      expense.createdAt ||
      new Date().toISOString(),
  };

  expenses.push(newExpense);

  saveExpenses(expenses);

  return newExpense;
}

// =====================================================
// DELETE EXPENSE
// =====================================================

export function deleteExpense(id) {
  const expenses = getExpenses();

  const updatedExpenses = expenses.filter(
    (expense) => expense.id !== id
  );

  saveExpenses(updatedExpenses);
}

// =====================================================
// UPDATE EXPENSE
// =====================================================

export function updateExpense(id, updatedExpense) {
  const expenses = getExpenses();

  const updatedExpenses = expenses.map((expense) =>
    expense.id === id
      ? {
          ...expense,
          ...updatedExpense,
          amount: Number(updatedExpense.amount || 0),
        }
      : expense
  );

  saveExpenses(updatedExpenses);
}

// =====================================================
// SAVE LOCAL EXPENSES
// =====================================================

function saveExpenses(expenses) {
  try {
    const safeExpenses = Array.isArray(expenses)
      ? expenses
      : [];

    // Main local storage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(safeExpenses)
    );

    // Separate local backup
    localStorage.setItem(
      LOCAL_BACKUP_KEY,
      JSON.stringify(safeExpenses)
    );
  } catch (error) {
    console.error(
      "Unable to save expenses:",
      error
    );

    alert(
      "VGlytics couldn't save this expense."
    );
  }
}

// =====================================================
// REPLACE LOCAL EXPENSES
// =====================================================
//
// Used by Firebase synchronization.
//
// IMPORTANT:
// This should only be called with a MERGED dataset.
// It must never blindly replace local data with
// cloud-only data.
//

export function replaceExpenses(expenses) {
  try {
    const safeExpenses = Array.isArray(expenses)
      ? expenses
      : [];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(safeExpenses)
    );

    // Keep backup synchronized with the final merged data
    localStorage.setItem(
      LOCAL_BACKUP_KEY,
      JSON.stringify(safeExpenses)
    );

    return true;
  } catch (error) {
    console.error(
      "Unable to replace local expenses:",
      error
    );

    return false;
  }
}

// =====================================================
// LOCAL EXPENSE BACKUP
// =====================================================

export function backupLocalExpenses() {
  try {
    const expenses = getExpenses();

    localStorage.setItem(
      LOCAL_BACKUP_KEY,
      JSON.stringify(expenses)
    );

    return true;
  } catch (error) {
    console.error(
      "Unable to backup local expenses:",
      error
    );

    return false;
  }
}

// =====================================================
// GET LOCAL BACKUP
// =====================================================

export function getLocalBackupExpenses() {
  try {
    const data =
      localStorage.getItem(
        LOCAL_BACKUP_KEY
      );

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Unable to read local expense backup:",
      error
    );

    return [];
  }
}

// =====================================================
// RESTORE LOCAL BACKUP
// =====================================================

export function restoreLocalBackupExpenses() {
  try {
    const backup =
      getLocalBackupExpenses();

    if (backup.length === 0) {
      return false;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(backup)
    );

    return true;
  } catch (error) {
    console.error(
      "Unable to restore local expense backup:",
      error
    );

    return false;
  }
}

// =====================================================
// CLEAR LOCAL EXPENSES
// =====================================================
//
// Use this only when the user explicitly chooses
// to clear their local expense data.
//

export function clearLocalExpenses() {
  try {
    localStorage.removeItem(STORAGE_KEY);

    return true;
  } catch (error) {
    console.error(
      "Unable to clear local expenses:",
      error
    );

    return false;
  }
}

// =====================================================
// BUDGET
// =====================================================

export function getBudget() {
  try {
    const savedBudget =
      localStorage.getItem(
        BUDGET_KEY
      );

    if (!savedBudget) {
      return 6000;
    }

    const budget =
      Number(savedBudget);

    if (
      !Number.isFinite(budget) ||
      budget <= 0
    ) {
      return 6000;
    }

    return budget;
  } catch {
    return 6000;
  }
}

// =====================================================
// SET BUDGET
// =====================================================

export function setBudget(amount) {
  const budget = Number(amount);

  if (
    !Number.isFinite(budget) ||
    budget <= 0
  ) {
    return false;
  }

  try {
    localStorage.setItem(
      BUDGET_KEY,
      String(budget)
    );

    return true;
  } catch (error) {
    console.error(
      "Unable to save budget:",
      error
    );

    return false;
  }
}