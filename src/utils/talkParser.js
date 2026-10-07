// =========================
// VGlytics SMART TALK
// =========================

import {
  getTotalSpent,
  getCategoryTotals,
  getHighestCategory,
  getMostExpensiveExpense,
  getHighestSpendingDay,
  getAverageDailySpending,
} from "./calculations";

import { getBudget } from "../services/expenseService";


// =========================
// HELPERS
// =========================

function getTodayKey() {
  const now = new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-` +
    `${String(
      now.getDate()
    ).padStart(2, "0")}`
  );
}


function getCurrentMonthKey() {
  const now = new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`
  );
}


function getCurrentMonthExpenses(
  expenses
) {
  const monthKey =
    getCurrentMonthKey();

  return expenses.filter(
    (expense) =>
      String(expense.date).startsWith(
        monthKey
      )
  );
}


function getTodayExpenses(
  expenses
) {
  const today =
    getTodayKey();

  return expenses.filter(
    (expense) =>
      expense.date === today
  );
}


function formatMoney(amount) {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN")}`;
}


function formatDate(date) {
  if (!date) {
    return "";
  }

  const parts =
    String(date).split("-");

  if (parts.length !== 3) {
    return date;
  }

  const parsed =
    new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


// =========================
// CATEGORY DETECTION
// =========================

function detectCategory(
  text
) {
  const lower =
    text.toLowerCase();

  if (
    lower.includes(
      "breakfast"
    )
  ) {
    return "Breakfast";
  }

  if (
    lower.includes(
      "lunch"
    )
  ) {
    return "Lunch";
  }

  if (
    lower.includes(
      "dinner"
    )
  ) {
    return "Dinner";
  }

  if (
    lower.includes(
      "snack"
    )
  ) {
    return "Snacks";
  }

  if (
    lower.includes(
      "drink"
    )
  ) {
    return "Drinks";
  }

  return null;
}


// =========================
// CATEGORY EXPENSES
// =========================

function getCategoryExpenses(
  expenses,
  category
) {
  return expenses.filter(
    (expense) =>
      String(
        expense.category
      ).toLowerCase() ===
      category.toLowerCase()
  );
}


// =========================
// QUESTIONS
// =========================

export function answerTalkQuestion(
  text,
  expenses = []
) {
  const lower =
    String(text)
      .toLowerCase()
      .trim();


  console.log(
    "Smart Talk checking:",
    lower
  );


  // =========================
  // TODAY'S SPENDING
  // =========================

  if (
    lower.includes("today") &&
    (
      lower.includes("spent") ||
      lower.includes("spending") ||
      lower.includes("expense") ||
      lower.includes("expenses")
    )
  ) {
    const todayExpenses =
      getTodayExpenses(
        expenses
      );

    const total =
      getTotalSpent(
        todayExpenses
      );

    return {
      success: true,
      type: "answer",
      answer:
        total > 0
          ? `You have spent ${formatMoney(
              total
            )} today.`
          : "You haven't recorded any expenses today.",
    };
  }


  // =========================
  // WHAT DID I SPEND TODAY
  // =========================

  if (
    lower.includes("what") &&
    lower.includes("today")
  ) {
    const todayExpenses =
      getTodayExpenses(
        expenses
      );

    if (
      todayExpenses.length === 0
    ) {
      return {
        success: true,
        type: "answer",
        answer:
          "You haven't recorded any expenses today.",
      };
    }

    const items =
      todayExpenses
        .map(
          (expense) =>
            `${expense.itemName} ${formatMoney(
              expense.amount
            )}`
        )
        .join(", ");

    return {
      success: true,
      type: "answer",
      answer:
        `Today you recorded: ${items}.`,
    };
  }


  // =========================
  // THIS MONTH SPENDING
  // =========================

  if (
    (
      lower.includes(
        "this month"
      ) ||
      lower.includes(
        "monthly"
      )
    ) &&
    (
      lower.includes("spent") ||
      lower.includes("spending") ||
      lower.includes("expense") ||
      lower.includes("expenses")
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const total =
      getTotalSpent(
        monthExpenses
      );

    return {
      success: true,
      type: "answer",
      answer:
        total > 0
          ? `You have spent ${formatMoney(
              total
            )} this month.`
          : "You haven't recorded any expenses this month.",
    };
  }


  // =========================
  // BUDGET
  // =========================

  if (
    lower.includes(
      "budget"
    ) &&
    (
      lower.includes("what") ||
      lower.includes("how much") ||
      lower.includes("my")
    )
  ) {
    const budget =
      getBudget();

    return {
      success: true,
      type: "answer",
      answer:
        `Your monthly budget is ${formatMoney(
          budget
        )}.`,
    };
  }


  // =========================
  // REMAINING BUDGET
  // =========================

  if (
    (
      lower.includes(
        "budget left"
      ) ||
      lower.includes(
        "budget remaining"
      ) ||
      lower.includes(
        "remaining budget"
      ) ||
      lower.includes(
        "how much can i spend"
      )
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const total =
      getTotalSpent(
        monthExpenses
      );

    const budget =
      getBudget();

    const remaining =
      budget - total;

    if (
      remaining <= 0
    ) {
      return {
        success: true,
        type: "answer",
        answer:
          `You have used your entire monthly budget and exceeded it by ${formatMoney(
            Math.abs(
              remaining
            )
          )}.`,
      };
    }

    return {
      success: true,
      type: "answer",
      answer:
        `You have ${formatMoney(
          remaining
        )} remaining from your monthly budget.`,
    };
  }


  // =========================
  // OVER BUDGET
  // =========================

  if (
    lower.includes(
      "over budget"
    ) ||
    lower.includes(
      "exceeded budget"
    ) ||
    lower.includes(
      "budget exceeded"
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const total =
      getTotalSpent(
        monthExpenses
      );

    const budget =
      getBudget();

    if (
      total > budget
    ) {
      return {
        success: true,
        type: "answer",
        answer:
          `Yes. You are over budget by ${formatMoney(
            total - budget
          )}.`,
      };
    }

    return {
      success: true,
      type: "answer",
      answer:
        `No. You are still ${formatMoney(
          budget - total
        )} within your budget.`,
    };
  }


  // =========================
  // HIGHEST CATEGORY
  // =========================

  if (
    lower.includes(
      "category"
    ) &&
    (
      lower.includes(
        "highest"
      ) ||
      lower.includes(
        "most"
      ) ||
      lower.includes(
        "maximum"
      ) ||
      lower.includes(
        "more"
      )
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const highest =
      getHighestCategory(
        monthExpenses
      );

    return {
      success: true,
      type: "answer",
      answer: highest
        ? `${highest.category} is your highest spending category at ${formatMoney(
            highest.amount
          )} this month.`
        : "You don't have any expenses recorded this month.",
    };
  }


  // =========================
  // BIGGEST EXPENSE
  // =========================

  if (
    lower.includes(
      "biggest expense"
    ) ||
    lower.includes(
      "largest expense"
    ) ||
    lower.includes(
      "most expensive expense"
    ) ||
    lower.includes(
      "biggest spending"
    ) ||
    lower.includes(
      "largest spending"
    ) ||
    lower.includes(
      "most expensive"
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const biggest =
      getMostExpensiveExpense(
        monthExpenses
      );

    return {
      success: true,
      type: "answer",
      answer: biggest
        ? `Your biggest expense this month is ${biggest.itemName} at ${formatMoney(
            biggest.amount
          )}.`
        : "You don't have any expenses recorded this month.",
    };
  }


  // =========================
  // CATEGORY BREAKDOWN
  // =========================

  if (
    lower.includes(
      "category breakdown"
    ) ||
    lower.includes(
      "spending breakdown"
    ) ||
    lower.includes(
      "breakdown"
    ) ||
    lower.includes(
      "all categories"
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const totals =
      getCategoryTotals(
        monthExpenses
      );

    const entries =
      Object.entries(
        totals
      ).sort(
        ([, a], [, b]) =>
          b - a
      );

    if (
      entries.length === 0
    ) {
      return {
        success: true,
        type: "answer",
        answer:
          "You don't have any expenses recorded this month.",
      };
    }

    const breakdown =
      entries
        .map(
          ([category, amount]) =>
            `${category}: ${formatMoney(
              amount
            )}`
        )
        .join(" • ");

    return {
      success: true,
      type: "answer",
      answer:
        `Your spending this month is: ${breakdown}`,
    };
  }


  // =========================
  // CATEGORY-SPECIFIC
  // =========================

  const category =
    detectCategory(
      lower
    );

  if (
    category &&
    (
      lower.includes(
        "spent"
      ) ||
      lower.includes(
        "spending"
      ) ||
      lower.includes(
        "expense"
      ) ||
      lower.includes(
        "expenses"
      ) ||
      lower.includes(
        "how much"
      )
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const categoryExpenses =
      getCategoryExpenses(
        monthExpenses,
        category
      );

    const total =
      getTotalSpent(
        categoryExpenses
      );

    return {
      success: true,
      type: "answer",
      answer:
        total > 0
          ? `You have spent ${formatMoney(
              total
            )} on ${category.toLowerCase()} this month.`
          : `You haven't recorded any ${category.toLowerCase()} expenses this month.`,
    };
  }


  // =========================
  // NUMBER OF EXPENSES
  // =========================

  if (
    (
      lower.includes(
        "how many"
      ) ||
      lower.includes(
        "number of"
      ) ||
      lower.includes(
        "count"
      )
    ) &&
    (
      lower.includes(
        "expense"
      ) ||
      lower.includes(
        "expenses"
      )
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    return {
      success: true,
      type: "answer",
      answer:
        `You have recorded ${monthExpenses.length} ${
          monthExpenses.length === 1
            ? "expense"
            : "expenses"
        } this month.`,
    };
  }


  // =========================
  // HIGHEST SPENDING DAY
  // =========================

  if (
    lower.includes(
      "highest spending day"
    ) ||
    lower.includes(
      "most expensive day"
    ) ||
    lower.includes(
      "highest spending date"
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const highestDay =
      getHighestSpendingDay(
        monthExpenses
      );

    return {
      success: true,
      type: "answer",
      answer:
        highestDay
          ? `Your highest spending day this month was ${formatDate(
              highestDay.date
            )} with ${formatMoney(
              highestDay.amount
            )} spent.`
          : "You don't have any expenses recorded this month.",
    };
  }


  // =========================
  // AVERAGE DAILY SPENDING
  // =========================

  if (
    lower.includes(
      "average"
    ) &&
    (
      lower.includes(
        "daily"
      ) ||
      lower.includes(
        "day"
      ) ||
      lower.includes(
        "spending"
      )
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const average =
      getAverageDailySpending(
        monthExpenses
      );

    return {
      success: true,
      type: "answer",
      answer:
        average > 0
          ? `Your average daily spending this month is ${formatMoney(
              average
            )}.`
          : "You don't have enough spending data this month yet.",
    };
  }


  // =========================
  // SUMMARY
  // =========================

  if (
    lower.includes(
      "summary"
    ) ||
    lower.includes(
      "spending summary"
    ) ||
    lower.includes(
      "money summary"
    ) ||
    lower.includes(
      "tell me about my spending"
    )
  ) {
    const monthExpenses =
      getCurrentMonthExpenses(
        expenses
      );

    const total =
      getTotalSpent(
        monthExpenses
      );

    const budget =
      getBudget();

    const remaining =
      budget - total;

    const highest =
      getHighestCategory(
        monthExpenses
      );

    const biggest =
      getMostExpensiveExpense(
        monthExpenses
      );

    if (
      monthExpenses.length === 0
    ) {
      return {
        success: true,
        type: "answer",
        answer:
          "You don't have any expenses recorded this month yet.",
      };
    }

    let answer =
      `This month you've spent ${formatMoney(
        total
      )} across ${monthExpenses.length} expenses. `;

    if (remaining >= 0) {
      answer +=
        `${formatMoney(
          remaining
        )} of your budget is remaining. `;
    } else {
      answer +=
        `You've exceeded your budget by ${formatMoney(
          Math.abs(
            remaining
          )
        )}. `;
    }

    if (highest) {
      answer +=
        `Your highest category is ${highest.category} at ${formatMoney(
          highest.amount
        )}. `;
    }

    if (biggest) {
      answer +=
        `Your biggest expense is ${biggest.itemName} at ${formatMoney(
          biggest.amount
        )}.`;
    }

    return {
      success: true,
      type: "answer",
      answer,
    };
  }


  // =========================
  // UNKNOWN
  // =========================

  return {
    success: false,
    type: "unknown",
    answer: "",
  };
}