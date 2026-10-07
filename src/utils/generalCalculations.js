export function getGeneralMonthlyExpenses(
  expenses,
  year,
  month
) {
  return expenses.filter(
    (expense) => {
      const date =
        new Date(expense.date);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    }
  );
}

export function getGeneralTotalSpent(
  expenses
) {
  return expenses.reduce(
    (total, expense) =>
      total +
      Number(
        expense.amount || 0
      ),
    0
  );
}

export function getGeneralCategoryTotals(
  expenses
) {
  return expenses.reduce(
    (totals, expense) => {
      const category =
        expense.category ||
        "Other";

      totals[category] =
        (totals[category] || 0) +
        Number(
          expense.amount || 0
        );

      return totals;
    },
    {}
  );
}