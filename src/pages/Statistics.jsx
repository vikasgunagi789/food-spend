import { useEffect, useMemo, useState } from "react";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Utensils,
  Trophy,
  Download,
} from "lucide-react";

import {
  getExpenses,
  getBudget,
} from "../services/expenseService";

import {
  getIngredientUsages,
} from "../services/ingredientService";

import {
  getMonthlyExpenses,
  getTotalSpent,
  getCategoryTotals,
  getHighestCategory,
  getMostExpensiveExpense,
  getAverageDailySpending,
  getHighestSpendingDay,
  getLowestSpendingDay,
} from "../utils/calculations";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* =====================================================
   HELPERS
   ===================================================== */

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* =====================================================
   COMPONENT
   ===================================================== */

function Statistics() {
  const [expenses, setExpenses] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(getBudget());

  const [selectedMonth, setSelectedMonth] = useState(() => {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
});


function handleExportCSV() {
  console.log("VGlytics Export Data:", monthlyExpenses);
  if (monthlyExpenses.length === 0) {
    alert("No expenses available to export.");
    return;
  }

  const headers = [
    "Date",
    "Item Name",
    "Category",
    "Amount",
  ];

  
const rows = monthlyExpenses.map((expense) => {
  const expenseDate =
    expense.date ||
    expense.createdAt ||
    expense.timestamp ||
    "";

  const formattedDate = expenseDate
    ? new Date(expenseDate).toLocaleDateString("en-IN")
    : "Date unavailable";

  return [
    formattedDate,
    expense.itemName || "Unnamed Expense",
    expense.category || "Other",
    Number(expense.amount || 0).toFixed(2),
  ];
});


  const escapeCSV = (value) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `VGlytics-${selectedMonth}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


function handleExportMonthlyReport() {
  if (monthlyExpenses.length === 0) {
    alert("No expenses available for this month.");
    return;
  }

  const totalSpent = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const remaining = monthlyBudget - totalSpent;

  
const sortedExpenses = [...monthlyExpenses].sort((a, b) => {
  return new Date(a.date) - new Date(b.date);
});


  const categoryTotals = {};

  monthlyExpenses.forEach((expense) => {
    const category = expense.category || "Other";

    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      Number(expense.amount || 0);
  });

  
const rows = [
  ["VGlytics Monthly Statistics Report"],
  ["Month", selectedMonth],
  [],
  ["MONTHLY SUMMARY"],
  ["Total Expenses", totalSpent.toFixed(2)],
  ["Monthly Budget", monthlyBudget.toFixed(2)],
  ["Remaining Budget", remaining.toFixed(2)],
  ["Number of Expenses", monthlyExpenses.length],
  [],
  ["CATEGORY-WISE SPENDING"],
  ["Category", "Total Spending"],
  ...Object.entries(categoryTotals).map(([category, amount]) => [
    category,
    amount.toFixed(2),
  ]),
  [],
  ["INDIVIDUAL EXPENSE DETAILS"],
  ["Date", "Item Name", "Category", "Amount"],
  ...sortedExpenses.map((expense) => [
    expense.date || "Date unavailable",
    expense.itemName || "Unnamed Expense",
    expense.category || "Other",
    Number(expense.amount || 0).toFixed(2),
  ]),
];


  const csv = rows
    .map((row) =>
      row.map((value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `VGlytics-Monthly-Report-${selectedMonth}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}



const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  /* ===================================================
     LOAD EXPENSES
     =================================================== */

  useEffect(() => {
  loadExpenses();

  function handleStorageChange() {
    loadExpenses();
  }

  function handleExpensesSynced() {
    console.log(
      "VGlytics: Statistics refreshing after Firebase sync..."
    );

    loadExpenses();
  }

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  window.addEventListener(
    "expensesUpdated",
    handleStorageChange
  );

  window.addEventListener(
    "expenses-synced",
    handleExpensesSynced
  );

  window.addEventListener(
    "focus",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorageChange
    );

    window.removeEventListener(
      "expensesUpdated",
      handleStorageChange
    );

    window.removeEventListener(
      "expenses-synced",
      handleExpensesSynced
    );

    window.removeEventListener(
      "focus",
      handleStorageChange
    );
  };
}, []);

  function loadExpenses() {
  const allExpenses = getExpenses();
  const usages = getIngredientUsages();

  console.log("ALL EXPENSES:", allExpenses);
console.log("INGREDIENT USAGES:", usages);

  const ingredientCosts = {};

  usages.forEach((usage) => {
    if (!usage.expenseId) return;

    ingredientCosts[usage.expenseId] =
      (ingredientCosts[usage.expenseId] || 0) +
      Number(usage.allocatedCost || 0);
  });

  const updatedExpenses = allExpenses.map((expense) => {
    const manualAmount = Number(expense.amount || 0);
    const ingredientAmount =
      ingredientCosts[expense.id] || 0;

    return {
      ...expense,

      // Use ingredient allocation when no manual amount exists.
      // Otherwise preserve the manually entered amount.
      amount:
        manualAmount > 0
          ? manualAmount
          : ingredientAmount,
    };
  });

  setExpenses(updatedExpenses);
}

  /* ===================================================
     CURRENT MONTH
     =================================================== */

  /* ===================================================
   SELECTED MONTH
   =================================================== */

const now = new Date();

const [selectedYear, selectedMonthIndex] =
  selectedMonth.split("-").map(Number);

const monthIndex = selectedMonthIndex - 1;

const selectedMonthDate = new Date(
  selectedYear,
  monthIndex,
  1
);

const monthlyExpenses = useMemo(() => {
  return getMonthlyExpenses(
    expenses,
    selectedYear,
    monthIndex
  );
}, [expenses, selectedYear, monthIndex]);


function handleExportCSV() {
  if (monthlyExpenses.length === 0) {
    alert("No expenses available to export.");
    return;
  }

  const headers = [
    "Date",
    "Item Name",
    "Category",
    "Amount",
  ];

  const rows = monthlyExpenses.map((expense) => {
    return [
      expense.date || "Date unavailable",
      expense.itemName || "Unnamed Expense",
      expense.category || "Other",
      Number(expense.amount || 0).toFixed(2),
    ];
  });

  const escapeCSV = (value) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `VGlytics-${selectedMonth}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

const handleExportPDF = () => {
  if (monthlyExpenses.length === 0) {
    alert("No expenses found for this month.");
    return;
  }

  const doc = new jsPDF();

  // Report title
  doc.setFontSize(18);
  doc.text("VGlytics Monthly Statistics Report", 14, 20);

  doc.setFontSize(11);
  doc.text(`Month: ${selectedMonth}`, 14, 30);

  // Calculate category totals
  const categoryMap = {};

  monthlyExpenses.forEach((expense) => {
    const category = expense.category || "Other";
    categoryMap[category] =
      (categoryMap[category] || 0) + Number(expense.amount || 0);
  });

  const categoryRows = Object.entries(categoryMap).map(
    ([category, amount]) => [
      category,
      `Rs. ${amount.toFixed(2)}`,
    ]
  );

  // Summary section
  autoTable(doc, {
    startY: 38,
    head: [["Monthly Summary", "Amount"]],
    body: [
      ["Total Spent", `Rs. ${Number(totalSpent).toFixed(2)}`],
      ["Monthly Budget", `Rs. ${Number(monthlyBudget).toFixed(2)}`],
      [
        "Remaining Budget",
        `Rs. ${(Number(monthlyBudget) - Number(totalSpent)).toFixed(2)}`,
      ],
      ["Number of Expenses", String(monthlyExpenses.length)],
    ],
  });

  // Category breakdown
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Category", "Total Spent"]],
    body: categoryRows,
  });

  // Individual expense details
  const sortedExpenses = [...monthlyExpenses].sort((a, b) =>
    String(a.date || "").localeCompare(String(b.date || ""))
  );

  const expenseRows = sortedExpenses.map((expense) => [
    formatDate(expense.date),
    expense.itemName || "Unnamed Item",
    expense.category || "Other",
    `Rs. ${Number(expense.amount || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Date", "Item Name", "Category", "Amount"]],
    body: expenseRows,
  });

  // Download PDF
  doc.save(`VGlytics-Monthly-Report-${selectedMonth}.pdf`);
};


/* ===================================================
   TOTAL SPENDING
   =================================================== */

const totalSpent = useMemo(() => {
  return getTotalSpent(monthlyExpenses);
}, [monthlyExpenses]);

// BUDGET VS ACTUAL SPENDING

const remainingBudget = monthlyBudget - totalSpent;

const budgetUsedPercentage =
  monthlyBudget > 0
    ? (totalSpent / monthlyBudget) * 100
    : 0;

const budgetProgress = Math.min(
  budgetUsedPercentage,
  100
);
/* ===================================================
   PREVIOUS MONTH COMPARISON
   =================================================== */

const previousMonthDate = new Date(
  selectedYear,
  monthIndex - 1,
  1
);

const previousMonthExpenses = useMemo(() => {
  return getMonthlyExpenses(
    expenses,
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth()
  );
}, [expenses, previousMonthDate.getFullYear(), previousMonthDate.getMonth()]);

const previousMonthTotal = useMemo(() => {
  return getTotalSpent(previousMonthExpenses);
}, [previousMonthExpenses]);

const spendingDifference =
  totalSpent - previousMonthTotal;

const spendingPercentage =
  previousMonthTotal > 0
    ? Math.abs(
        (spendingDifference / previousMonthTotal) * 100
      )
    : 0;

const previousMonthName =
  previousMonthDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  /* ===================================================
     CATEGORY TOTALS
     =================================================== */

  const categoryTotals = useMemo(() => {
    return getCategoryTotals(monthlyExpenses);
  }, [monthlyExpenses]);

  /* ===================================================
     HIGHEST CATEGORY
     =================================================== */

  const highestCategory = useMemo(() => {
    return getHighestCategory(monthlyExpenses);
  }, [monthlyExpenses]);

  /* ===================================================
     MOST EXPENSIVE EXPENSE
     =================================================== */

  const mostExpensiveExpense = useMemo(() => {
    return getMostExpensiveExpense(monthlyExpenses);
  }, [monthlyExpenses]);

  /* ===================================================
     AVERAGE DAILY SPENDING
     =================================================== */

  const averageDailySpending = useMemo(() => {
    return getAverageDailySpending(monthlyExpenses);
  }, [monthlyExpenses]);

  /* ===================================================
     HIGHEST DAY
     =================================================== */

  const highestDay = useMemo(() => {
    return getHighestSpendingDay(monthlyExpenses);
  }, [monthlyExpenses]);

  /* ===================================================
     LOWEST DAY
     =================================================== */

  const lowestDay = useMemo(() => {
    return getLowestSpendingDay(monthlyExpenses);
  }, [monthlyExpenses]);

  /* ===================================================
     CATEGORY BAR CHART DATA
     =================================================== */

  const categoryChartData = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort(
        ([, amountA], [, amountB]) =>
          amountB - amountA
      )
      .map(([category, amount]) => ({
        category,
        amount,
      }));
  }, [categoryTotals]);

  /* ===================================================
     CATEGORY DONUT DATA
     =================================================== */

  const categoryDonutData = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort(
        ([, amountA], [, amountB]) =>
          amountB - amountA
      )
      .map(([category, amount]) => ({
        category,
        amount,
      }));
  }, [categoryTotals]);

  /* ===================================================
     DONUT COLORS
     =================================================== */

  const DONUT_COLORS = [
    "#0f9f9a",
    "#38bdf8",
    "#6366f1",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  /* ===================================================
   CALENDAR HEATMAP DATA
   =================================================== */

const calendarData = useMemo(() => {
  const firstDay = new Date(
    selectedYear,
    monthIndex,
    1
  );

  const daysInMonth = new Date(
    selectedYear,
    monthIndex + 1,
    0
  ).getDate();

  const startingDay = firstDay.getDay();

  const dailyTotals = {};

  monthlyExpenses.forEach((expense) => {
    const dateKey = expense.date;

    dailyTotals[dateKey] =
      (dailyTotals[dateKey] || 0) +
      Number(expense.amount || 0);
  });

  const maxSpending = Math.max(
    0,
    ...Object.values(dailyTotals)
  );

  const days = Array.from(
    { length: daysInMonth },
    (_, index) => {
      const day = index + 1;

      const dateKey = [
        selectedYear,
        String(monthIndex + 1).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");

      const amount = dailyTotals[dateKey] || 0;

      let intensity = 0;

      if (amount > 0 && maxSpending > 0) {
        const ratio = amount / maxSpending;

        if (ratio <= 0.25) intensity = 1;
        else if (ratio <= 0.50) intensity = 2;
        else if (ratio <= 0.75) intensity = 3;
        else intensity = 4;
      }

      return {
        day,
        dateKey,
        amount,
        intensity,
      };
    }
  );

  return {
    startingDay,
    days,
  };
}, [monthlyExpenses, selectedYear, monthIndex]);

  /* ===================================================
     DAILY SPENDING DATA
     =================================================== */

  const dailyChartData = useMemo(() => {
  const dailyTotals = {};

  monthlyExpenses.forEach((expense) => {
    const date = expense.date;

    dailyTotals[date] =
      (dailyTotals[date] || 0) +
      Number(expense.amount || 0);
  });

  const daysInMonth = new Date(
    selectedYear,
    monthIndex + 1,
    0
  ).getDate();

  const isCurrentMonth =
    selectedYear === now.getFullYear() &&
    monthIndex === now.getMonth();

  const lastDay = isCurrentMonth
    ? now.getDate()
    : daysInMonth;

  const days = [];

  for (let day = 1; day <= lastDay; day++) {
    const dateKey = [
      selectedYear,
      String(monthIndex + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");

    const date = new Date(
      selectedYear,
      monthIndex,
      day
    );

    const amount = Number(
      dailyTotals[dateKey] || 0
    );

    days.push({
      date: date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),

      amount,

      hasExpense: amount > 0,

      status:
        amount > 0
          ? "Food expenses recorded"
          : "No food items added",
    });
  }

  return days;
}, [monthlyExpenses, selectedYear, monthIndex]);

  /* ===================================================
     MONTH NAME
     =================================================== */

  const currentMonthName =
  selectedMonthDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  /* ===================================================
     RENDER
     =================================================== */

  return (
    <div className="page statistics-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="page-header">

        <div>

          <p className="page-kicker">
            VGlytics Analytics
          </p>

          <h1>
            Statistics
          </h1>

          <p>
  Your spending overview for {currentMonthName}
</p>

<div style={{ marginTop: "14px" }}>
  <label
    htmlFor="statistics-month"
    style={{
      display: "block",
      marginBottom: "6px",
      fontSize: "13px",
      fontWeight: 600,
    }}
  >
    Select Month
  </label>

  <input
    id="statistics-month"
    type="month"
    value={selectedMonth}
    max={`${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`}
    onChange={(event) =>
      setSelectedMonth(event.target.value)
    }
    style={{
      padding: "10px 12px",
      borderRadius: "10px",
      border: "1px solid #d1d5db",
      fontSize: "14px",
      maxWidth: "220px",
    }}
  />
</div>

        </div>

        <div style={{
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
}}>

  <button
    type="button"
    // onClick={handleExportCSV}
    onClick={handleExportMonthlyReport}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "11px 16px",
      borderRadius: "10px",
      border: "none",
      background: "#0f9f9a",
      color: "#ffffff",
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
    <Download size={18} />
    Export CSV
  </button>

  <button
  type="button"
  onClick={handleExportPDF}
  className="your-existing-button-class"
>
  <Download size={18} />
  Export PDF
</button>

  <div className="statistics-header-icon">
    <BarChart3 size={24} />
  </div>

</div>

      </div>


      {/* =================================================
          SUMMARY CARDS
          ================================================= */}

      <div className="statistics-summary-grid">

        {/* TOTAL SPENT */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <Wallet size={20} />
          </div>

          <div>

            <span>
              Total Spent
            </span>

            <strong>
              {formatMoney(totalSpent)}
            </strong>

          </div>

        </div>


        


        {/* AVERAGE */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <TrendingUp size={20} />
          </div>

          <div>

            <span>
              Average / Day
            </span>

            <strong>
              {formatMoney(
                averageDailySpending
              )}
            </strong>

          </div>

        </div>


        {/* TOP CATEGORY */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <Trophy size={20} />
          </div>

          <div>

            <span>
              Top Category
            </span>

            <strong>
              {highestCategory?.category || "-"}
            </strong>

          </div>

        </div>


        {/* MOST EXPENSIVE */}

        <div className="statistics-card">

          <div className="statistics-card-icon">
            <Utensils size={20} />
          </div>

          <div>

            <span>
              Most Expensive
            </span>

            <strong>
              {mostExpensiveExpense
                ? formatMoney(
                    mostExpensiveExpense.amount
                  )
                : "-"}
            </strong>

          </div>

        </div>

      </div>

      {/* =================================================
    BUDGET VS ACTUAL SPENDING
    ================================================= */}

<section className="statistics-section">

  <div className="statistics-section-title">

    <Wallet size={20} />

    <div>
      <h2>Budget vs Actual Spending</h2>
      <p>Track your monthly budget against actual expenses.</p>
    </div>

  </div>

  <div className="budget-comparison-card">

    <div className="budget-comparison-values">

      <div>
        <span>Monthly Budget</span>
        <strong>{formatMoney(monthlyBudget)}</strong>
      </div>

      <div>
        <span>Actual Spending</span>
        <strong>{formatMoney(totalSpent)}</strong>
      </div>

    </div>

    <div className="budget-progress-info">

      <span>Budget Used</span>

      <strong>
        {Math.round(budgetUsedPercentage)}%
      </strong>

    </div>

    <div className="budget-comparison-progress">
      <div
        className={`budget-comparison-fill ${
          budgetUsedPercentage > 100 ? "over-budget" : ""
        }`}
        style={{ width: `${budgetProgress}%` }}
      />
    </div>

    <div className="budget-remaining">

      {monthlyBudget <= 0 ? (
        <p>Please set a monthly budget to view your budget status.</p>
      ) : remainingBudget >= 0 ? (
        <p>
          Remaining budget: <strong>{formatMoney(remainingBudget)}</strong>
        </p>
      ) : (
        <p>
          You exceeded your budget by{" "}
          <strong>{formatMoney(Math.abs(remainingBudget))}</strong>
        </p>
      )}

    </div>

  </div>

</section>


      {/* =================================================
          SPENDING INSIGHT
          ================================================= */}

      <section className="statistics-section">

        <div className="statistics-section-title">

          <TrendingUp size={20} />

          <div>

            <h2>
              Spending Insight
            </h2>

            <p>
              A quick look at your spending habits.
            </p>

          </div>

        </div>


        <div className="insight-card">

          {highestCategory ? (

            <>

              <div className="insight-icon">
                <TrendingUp size={21} />
              </div>

              <div>

                <strong>
                  {highestCategory.category}
                </strong>

                <p>
                  is your highest spending category
                  this month with{" "}
                  <b>
                    {formatMoney(
                      highestCategory.amount
                    )}
                  </b>.
                </p>

              </div>

            </>

          ) : (

            <>

              <div className="insight-icon">
                <BarChart3 size={21} />
              </div>

              <div>

                <strong>
                  Start tracking
                </strong>

                <p>
                  Add your first expense to see
                  your spending insights.
                </p>

              </div>

            </>

          )}

        </div>

      </section>


      {/* =================================================
          CATEGORY SPENDING
          ================================================= */}

      <section className="statistics-section">

        <div className="statistics-section-title">

          <BarChart3 size={20} />

          <div>

            <h2>
              Category Spending
            </h2>

            <p>
              See where your money is going.
            </p>

          </div>

        </div>


        {categoryChartData.length > 0 ? (

          <div className="chart-card">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart
                data={categoryChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="category"
                  tick={{
                    fontSize: 12,
                    fill: "#4b5563",
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: "#4b5563",
                  }}
                />

                <Tooltip
                  content={({
                    active,
                    payload,
                    label,
                  }) => {

                    if (
                      !active ||
                      !payload ||
                      payload.length === 0
                    ) {
                      return null;
                    }

                    const data =
                      payload[0]?.payload;

                    return (
                      <div
                        style={{
                          background: "#ffffff",
                          border:
                            "1px solid #dbe7e7",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          boxShadow:
                            "0 6px 18px rgba(0,0,0,0.10)",
                        }}
                      >

                        <div
                          style={{
                            fontWeight: 700,
                            marginBottom: "4px",
                            color: "#111827",
                          }}
                        >
                          {label}
                        </div>

                        <div
                          style={{
                            color: "#374151",
                          }}
                        >
                          Food spending:{" "}
                          <strong>
                            {formatMoney(
                              data.amount
                            )}
                          </strong>
                        </div>

                      </div>
                    );

                  }}
                />

                <Bar
                  dataKey="amount"
                  fill="#0f9f9a"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <div className="empty-statistics">
            No spending data available yet.
          </div>

        )}

      </section>


      {/* =================================================
          DAILY SPENDING
          ================================================= */}

      <section className="statistics-section">

        <div className="statistics-section-title">

          <CalendarDays size={20} />

          <div>

            <h2>
              Daily Spending
            </h2>

            <p>
              Your spending across the month.
            </p>

          </div>

        </div>


        {/* =================================================
            DAILY CHART
            ================================================= */}

        <div className="chart-card">

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={dailyChartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 10,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              {/* =================================================
                  DATE AXIS

                  Do NOT use interval={0}.
                  Recharts will automatically hide some labels
                  when there are many days, preventing overlap.
                  ================================================= */}

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: "#4b5563",
                }}
                interval="preserveStartEnd"
              />

              <YAxis
                tick={{
                  fontSize: 12,
                  fill: "#4b5563",
                }}
                tickFormatter={(value) =>
                  `₹${value}`
                }
              />


              {/* =================================================
                  CUSTOM TOOLTIP
                  ================================================= */}

              <Tooltip
                content={({
                  active,
                  payload,
                  label,
                }) => {

                  if (
                    !active ||
                    !payload ||
                    payload.length === 0
                  ) {
                    return null;
                  }

                  const data =
                    payload[0]?.payload;

                  if (!data) {
                    return null;
                  }

                  return (
                    <div
                      style={{
                        background: "#ffffff",
                        border:
                          "1px solid #dbe7e7",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        boxShadow:
                          "0 6px 18px rgba(0,0,0,0.10)",
                        minWidth: "150px",
                      }}
                    >

                      {/* DATE */}

                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: "5px",
                          color: "#111827",
                        }}
                      >
                        {label}
                      </div>


                      {/* DAY WITH EXPENSE */}

                      {data.hasExpense ? (

                        <div
                          style={{
                            color: "#374151",
                          }}
                        >
                          Food spending:{" "}
                          <strong>
                            {formatMoney(
                              data.amount
                            )}
                          </strong>
                        </div>

                      ) : (

                        /* DAY WITHOUT EXPENSE */

                        <div
                          style={{
                            color: "#6b7280",
                          }}
                        >
                          No food items added
                        </div>

                      )}

                    </div>
                  );

                }}
              />


              {/* =================================================
                  DAILY SPENDING BAR
                  ================================================= */}

              <Bar
                dataKey="amount"
                fill="#0f9f9a"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* SPENDING CALENDAR HEATMAP */}
<div className="calendar-heatmap">
  <div className="calendar-heatmap-header">
    <h3>Spending Calendar</h3>
    <p>Daily spending throughout the month</p>
  </div>

  <div className="calendar-weekdays">
    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
      <div key={day}>{day}</div>
    ))}
  </div>

  <div className="calendar-days">
    {Array.from({ length: calendarData.startingDay }).map((_, index) => (
      <div key={`empty-${index}`} className="calendar-empty" />
    ))}

    {calendarData.days.map((day) => (
      <button
  key={day.dateKey}
  type="button"
  className={`calendar-day intensity-${day.intensity} ${
    selectedCalendarDay === day.dateKey ? "selected" : ""
  }`}
  title={`${day.dateKey}: ₹${day.amount.toFixed(2)}`}
  onClick={() => setSelectedCalendarDay(day.dateKey)}
>
  <span>{day.day}</span>
</button>
    ))}
  </div>

  {selectedCalendarDay && (
  <div className="calendar-day-details">
    <h4>{selectedCalendarDay}</h4>

    <p>
      Total spent: ₹
      {(
        calendarData.days.find(
          (day) => day.dateKey === selectedCalendarDay
        )?.amount || 0
      ).toFixed(2)}
    </p>

    <p>
      Number of expenses:{" "}
      {
        monthlyExpenses.filter(
          (expense) => expense.date === selectedCalendarDay
        ).length
      }
    </p>

    <div className="calendar-expense-list">
      <h5>Expense Details</h5>

      {monthlyExpenses
        .filter(
          (expense) => expense.date === selectedCalendarDay
        )
        .map((expense) => (
          <div
            className="calendar-expense-item"
            key={expense.id}
          >
            <span>{expense.itemName || "Unnamed Expense"}</span>

            <strong>₹{Number(expense.amount || 0).toFixed(2)}</strong>
          </div>
        ))}
    </div>
  </div>
)}

  <div className="calendar-legend">
    <span>Less</span>
    {[0, 1, 2, 3, 4].map((level) => (
      <div
        key={level}
        className={`calendar-legend-box intensity-${level}`}
      />
    ))}
    <span>More</span>
  </div>
</div>


      {/* =================================================
          SPENDING DAYS
          ================================================= */}

      <section className="statistics-section">

        <div className="statistics-section-title">

          <CalendarDays size={20} />

          <div>

            <h2>
              Spending Days
            </h2>

            <p>
              Your highest and lowest spending days.
            </p>

          </div>

        </div>


        <div className="day-stat-grid">

          {/* =================================================
              HIGHEST DAY
              ================================================= */}

          <div className="day-stat-card">

            <div className="day-stat-icon">
              <TrendingUp size={20} />
            </div>

            <span>
              Highest Day
            </span>

            <strong>
              {highestDay
                ? formatMoney(
                    highestDay.amount
                  )
                : "-"}
            </strong>

            <p>
              {highestDay
                ? formatDate(
                    highestDay.date
                  )
                : "No data"}
            </p>

          </div>


          {/* =================================================
              LOWEST DAY
              ================================================= */}

          <div className="day-stat-card">

            <div className="day-stat-icon">
              <TrendingDown size={20} />
            </div>

            <span>
              Lowest Day
            </span>

            <strong>
              {lowestDay
                ? formatMoney(
                    lowestDay.amount
                  )
                : "-"}
            </strong>

            <p>
              {lowestDay
                ? formatDate(
                    lowestDay.date
                  )
                : "No data"}
            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          CATEGORY BREAKDOWN
          ================================================= */}

      <section className="statistics-section">

        <div className="statistics-section-title">

          <Utensils size={20} />

          <div>

            <h2>
              Category Breakdown
            </h2>

            <p>
              See how your total spending is distributed.
            </p>

          </div>

        </div>


        {categoryDonutData.length === 0 ? (

          <div className="empty-statistics">
            No expenses recorded this month.
          </div>

        ) : (

          <div className="category-donut-card">

            {/* ===========================================
                DONUT
                =========================================== */}

            <div className="category-donut-chart">

              <PieChart
                width={240}
                height={240}
              >

                <Pie
                  data={categoryDonutData}
                  dataKey="amount"
                  nameKey="category"
                  cx={120}
                  cy={120}
                  innerRadius={68}
                  outerRadius={98}
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                  stroke="#ffffff"
                  strokeWidth={3}
                >

                  {categoryDonutData.map(
                    (entry, index) => (

                      <Cell
                        key={`cell-${index}`}
                        fill={
                          DONUT_COLORS[
                            index %
                            DONUT_COLORS.length
                          ]
                        }
                      />

                    )
                  )}

                </Pie>


                <Tooltip
                  formatter={(value) =>
                    formatMoney(value)
                  }
                />

              </PieChart>


              {/* CENTER TOTAL */}

              <div className="donut-center">

                <span>
                  Total
                </span>

                <strong>
                  {formatMoney(totalSpent)}
                </strong>

              </div>

            </div>


            {/* ===========================================
                CATEGORY LIST
                =========================================== */}

            <div className="category-donut-list">

              {categoryDonutData.map(
                ({ category, amount }, index) => {

                  const percentage =
                    totalSpent > 0
                      ? (amount / totalSpent) *
                        100
                      : 0;

                  return (

                    <div
                      className="category-donut-row"
                      key={category}
                    >

                      <div className="category-donut-name">

                        <span
                          className="category-dot"
                          style={{
                            backgroundColor:
                              DONUT_COLORS[
                                index %
                                DONUT_COLORS.length
                              ],
                          }}
                        />

                        <span>
                          {category}
                        </span>

                      </div>


                      <strong>
                        {formatMoney(amount)}
                      </strong>


                      <small>
                        {Math.round(
                          percentage
                        )}
                        %
                      </small>

                    </div>

                  );

                }
              )}

            </div>

          </div>

        )}

      </section>

    </div>
  );
}

export default Statistics;