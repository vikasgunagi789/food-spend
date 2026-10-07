// =========================
// WEEKLY MONEY REPORT
// =========================

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  if (!dateString) return null;

  const parts = String(dateString).split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const date = new Date(
    year,
    month,
    day
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// Monday = 0 ... Sunday = 6
function getMonday(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + difference
  );

  return result;
}

function formatMoney(amount) {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    }
  );
}

function getWeekExpenses(
  expenses,
  startDate
) {
  const endDate = new Date(startDate);

  endDate.setDate(
    endDate.getDate() + 6
  );

  endDate.setHours(
    23,
    59,
    59,
    999
  );

  return expenses.filter(
    (expense) => {
      const date = parseDate(
        expense.date
      );

      if (!date) return false;

      return (
        date >= startDate &&
        date <= endDate
      );
    }
  );
}

function getDailyData(
  expenses,
  startDate
) {
  const result = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);

    date.setDate(
      startDate.getDate() + i
    );

    const key = getDateKey(date);

    const dayExpenses =
      expenses.filter(
        (expense) =>
          expense.date === key
      );

    const total =
      dayExpenses.reduce(
        (sum, expense) =>
          sum +
          Number(
            expense.amount || 0
          ),
        0
      );

    result.push({
      date: key,
      label: date.toLocaleDateString(
        "en-IN",
        {
          weekday: "short",
        }
      ),
      shortDate: formatDate(date),
      amount: total,
      expenses: dayExpenses.length,
    });
  }

  return result;
}

function getCategoryData(expenses) {
  const totals = {};

  expenses.forEach(
    (expense) => {
      const category =
        expense.category ||
        "Other";

      totals[category] =
        (totals[category] || 0) +
        Number(
          expense.amount || 0
        );
    }
  );

  return Object.entries(
    totals
  )
    .map(
      ([category, amount]) => ({
        category,
        amount,
      })
    )
    .sort(
      (a, b) =>
        b.amount - a.amount
    );
}

function getTotal(expenses) {
  return expenses.reduce(
    (sum, expense) =>
      sum +
      Number(
        expense.amount || 0
      ),
    0
  );
}

// =========================
// MAIN REPORT
// =========================

export function getWeeklyReport(
  expenses = [],
  referenceDate = new Date()
) {
  const currentDate =
    new Date(referenceDate);

  currentDate.setHours(
    0,
    0,
    0,
    0
  );

  const currentMonday =
    getMonday(currentDate);

  const previousMonday =
    new Date(currentMonday);

  previousMonday.setDate(
    previousMonday.getDate() - 7
  );

  const currentWeekExpenses =
    getWeekExpenses(
      expenses,
      currentMonday
    );

  const previousWeekExpenses =
    getWeekExpenses(
      expenses,
      previousMonday
    );

  const currentTotal =
    getTotal(
      currentWeekExpenses
    );

  const previousTotal =
    getTotal(
      previousWeekExpenses
    );

  const dailyData =
    getDailyData(
      expenses,
      currentMonday
    );

  const categoryData =
    getCategoryData(
      currentWeekExpenses
    );

  const highestDay =
    [...dailyData]
      .sort(
        (a, b) =>
          b.amount - a.amount
      )[0];

  const averageDaily =
    currentTotal / 7;

  let percentageChange = 0;

  if (previousTotal > 0) {
    percentageChange =
      ((currentTotal -
        previousTotal) /
        previousTotal) *
      100;
  } else if (
    currentTotal > 0
  ) {
    percentageChange = 100;
  }

  return {
    startDate: currentMonday,
    endDate: new Date(
      currentMonday.getFullYear(),
      currentMonday.getMonth(),
      currentMonday.getDate() + 6
    ),

    total: currentTotal,

    previousTotal,

    percentageChange,

    averageDaily,

    expenseCount:
      currentWeekExpenses.length,

    dailyData,

    categoryData,

    highestDay:
      highestDay &&
      highestDay.amount > 0
        ? highestDay
        : null,

    highestCategory:
      categoryData.length > 0
        ? categoryData[0]
        : null,

    hasData:
      currentWeekExpenses.length >
      0,

    formatMoney,
  };
}