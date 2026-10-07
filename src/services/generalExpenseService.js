const STORAGE_KEY =
  "foodspend_general_expenses";

export function getGeneralExpenses() {
  try {
    const data =
      localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Unable to read general expenses:",
      error
    );

    return [];
  }
}

export function addGeneralExpense(expense) {
  const expenses =
    getGeneralExpenses();

  const newExpense = {
    id:
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`,

    itemName:
      expense.itemName?.trim() ||
      "Expense",

    amount:
      Number(expense.amount) || 0,

    category:
      expense.category || "Other",

    date:
      expense.date,

    note:
      expense.note?.trim() || "",

    createdAt:
      new Date().toISOString(),
  };

  expenses.push(newExpense);

  saveGeneralExpenses(expenses);

  return newExpense;
}

export function deleteGeneralExpense(id) {
  const expenses =
    getGeneralExpenses();

  const updatedExpenses =
    expenses.filter(
      (expense) =>
        expense.id !== id
    );

  saveGeneralExpenses(
    updatedExpenses
  );
}

export function updateGeneralExpense(
  id,
  updatedExpense
) {
  const expenses =
    getGeneralExpenses();

  const updatedExpenses =
    expenses.map((expense) =>
      expense.id === id
        ? {
            ...expense,
            ...updatedExpense,
            amount:
              Number(
                updatedExpense.amount
              ) || 0,
          }
        : expense
    );

  saveGeneralExpenses(
    updatedExpenses
  );
}

function saveGeneralExpenses(
  expenses
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(expenses)
    );

    window.dispatchEvent(
      new Event(
        "generalExpensesUpdated"
      )
    );
  } catch (error) {
    console.error(
      "Unable to save general expenses:",
      error
    );

    alert(
      "VGlytics couldn't save this expense."
    );
  }
}