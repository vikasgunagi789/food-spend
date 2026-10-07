import {
  getTotalSpent,
  getCategoryTotals,
} from "./calculations";

function getTodayKey() {
  const now = new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`
  );
}

function getCurrentMonthExpenses(expenses) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return expenses.filter((expense) => {
    const parts = String(expense.date).split("-");

    if (parts.length !== 3) return false;

    return (
      Number(parts[0]) === year &&
      Number(parts[1]) === month
    );
  });
}

function getTodayExpenses(expenses) {
  const today = getTodayKey();

  return expenses.filter(
    (expense) => expense.date === today
  );
}

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function getSmartInsight(expenses = [], budget = 6000) {
  if (!expenses.length) {
    return {
      title: "Start tracking",
      message:
        "Record your first food expense and VGlytics will start learning your spending patterns.",
      type: "start",
    };
  }

  const monthExpenses =
    getCurrentMonthExpenses(expenses);

  const todayExpenses =
    getTodayExpenses(expenses);

  const monthTotal =
    getTotalSpent(monthExpenses);

  const todayTotal =
    getTotalSpent(todayExpenses);

  const categoryTotals =
    getCategoryTotals(monthExpenses);

  const categories =
    Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);

  const topCategory =
    categories.length > 0
      ? categories[0]
      : null;

  // Budget insight
  if (monthTotal > budget) {
    return {
      title: "Budget update",
      message:
        `You've crossed your monthly budget by ${formatMoney(
          monthTotal - budget
        )}.`,
      type: "budget-warning",
    };
  }

  // No spending today
  if (todayExpenses.length === 0) {
    return {
      title: "Today's insight",
      message:
        "You haven't recorded any expenses today yet.",
      type: "today-empty",
    };
  }

  // Today's spending
  if (todayTotal > 0) {
    return {
      title: "Today's insight",
      message:
        `You've spent ${formatMoney(
          todayTotal
        )} today across ${todayExpenses.length} ${
          todayExpenses.length === 1
            ? "expense"
            : "expenses"
        }.`,
      type: "today",
    };
  }

  // Highest category
  if (topCategory) {
    return {
      title: "Your spending insight",
      message:
        `${topCategory[0]} is your highest spending category this month at ${formatMoney(
          topCategory[1]
        )}.`,
      type: "category",
    };
  }

  return {
    title: "Your spending insight",
    message:
      `You've spent ${formatMoney(
        monthTotal
      )} this month.`,
    type: "monthly",
  };
}