export function getMonthlyExpenses(expenses, year, month) {
  return expenses.filter((expense) => {
    const date = new Date(expense.date);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month
    );
  });
}

export function getTotalSpent(expenses) {
  return expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );
}

export function getCategoryTotals(expenses) {
  return expenses.reduce((totals, expense) => {
    const category = expense.category || "Other";

    totals[category] =
      (totals[category] || 0) +
      Number(expense.amount || 0);

    return totals;
  }, {});
}

export function getHighestCategory(expenses) {
  const totals = getCategoryTotals(expenses);

  const entries = Object.entries(totals);

  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);

  return {
    category: entries[0][0],
    amount: entries[0][1],
  };
}

export function getMostExpensiveExpense(expenses) {
  if (expenses.length === 0) return null;

  return expenses.reduce((highest, expense) => {
    return Number(expense.amount) >
      Number(highest.amount)
      ? expense
      : highest;
  });
}

export function getDailyTotals(expenses) {
  return expenses.reduce((totals, expense) => {
    const date = expense.date;

    totals[date] =
      (totals[date] || 0) +
      Number(expense.amount || 0);

    return totals;
  }, {});
}

export function getAverageDailySpending(expenses) {
  if (expenses.length === 0) return 0;

  const dailyTotals = getDailyTotals(expenses);

  const days = Object.keys(dailyTotals);

  if (days.length === 0) return 0;

  return (
    getTotalSpent(expenses) / days.length
  );
}

export function getHighestSpendingDay(expenses) {
  const dailyTotals = getDailyTotals(expenses);

  const entries = Object.entries(dailyTotals);

  if (entries.length === 0) return null;

  // Sort by amount descending
  // If amount is same, choose latest date
  entries.sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return new Date(b[0]) - new Date(a[0]);
  });

  return {
    date: entries[0][0],
    amount: entries[0][1],
  };
}

export function getLowestSpendingDay(expenses) {
  const dailyTotals = getDailyTotals(expenses);

  // Ignore zero amount days
  const entries = Object.entries(dailyTotals)
    .filter(([, amount]) => Number(amount) > 0);

  if (entries.length === 0) return null;

  // Sort by amount ascending
  // If amount is same, choose latest date
  entries.sort((a, b) => {
    if (a[1] !== b[1]) {
      return a[1] - b[1];
    }

    return new Date(b[0]) - new Date(a[0]);
  });

  return {
    date: entries[0][0],
    amount: entries[0][1],
  };
}