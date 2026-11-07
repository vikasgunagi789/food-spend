import { useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Utensils,
  Trophy,
} from "lucide-react";

import { getExpenses } from "../services/expenseService";

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
    setExpenses(getExpenses());
  }

  /* ===================================================
     CURRENT MONTH
     =================================================== */

  const now = new Date();

  const monthlyExpenses = useMemo(() => {
    return getMonthlyExpenses(
      expenses,
      now.getFullYear(),
      now.getMonth()
    );
  }, [expenses]);

  /* ===================================================
     TOTAL SPENDING
     =================================================== */

  const totalSpent = useMemo(() => {
    return getTotalSpent(monthlyExpenses);
  }, [monthlyExpenses]);

  /* =====================================================
     PREVIOUS MONTH
     ===================================================== */

  const previousMonthExpenses = useMemo(() => {
    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    return getMonthlyExpenses(
      expenses,
      previousMonth.getFullYear(),
      previousMonth.getMonth()
    );
  }, [expenses]);

  const previousMonthTotal = useMemo(() => {
    return getTotalSpent(previousMonthExpenses);
  }, [previousMonthExpenses]);

  const spendingDifference =
    totalSpent - previousMonthTotal;

  const spendingPercentage =
    previousMonthTotal > 0
      ? Math.abs(
          (spendingDifference /
            previousMonthTotal) *
            100
        )
      : 0;

  const previousMonthName =
    new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    ).toLocaleDateString("en-IN", {
      month: "long",
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
     DAILY SPENDING DATA
     =================================================== */

  const dailyChartData = useMemo(() => {
    const dailyTotals = {};

    /*
      Calculate total spending for every
      recorded date.
    */
    monthlyExpenses.forEach((expense) => {
      const date = expense.date;

      dailyTotals[date] =
        (dailyTotals[date] || 0) +
        Number(expense.amount || 0);
    });

    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();
    const todayDate = today.getDate();

    const days = [];

    /*
      Create a data point for every day
      from the 1st of the month until today.
    */
    for (let day = 1; day <= todayDate; day++) {
      const date = new Date(
        year,
        month,
        day
      );

      /*
        Create the same YYYY-MM-DD format
        used by the stored expense date.
      */
      const dateKey = [
        year,
        String(month + 1).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");

      const amount = Number(
        dailyTotals[dateKey] || 0
      );

      days.push({
        date: date.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
          }
        ),

        amount,

        /*
          Used by the custom tooltip.
        */
        hasExpense: amount > 0,

        status:
          amount > 0
            ? "Food expenses recorded"
            : "No food items added",
      });
    }

    return days;
  }, [monthlyExpenses]);

  /* ===================================================
     MONTH NAME
     =================================================== */

  const currentMonthName =
    now.toLocaleDateString("en-IN", {
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
            Your spending overview for{" "}
            {currentMonthName}
          </p>

        </div>

        <div className="statistics-header-icon">
          <BarChart3 size={24} />
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


        {/* =================================================
            MONTH COMPARISON
            ================================================= */}

        <section className="statistics-section">

          <div className="statistics-section-title">

            <TrendingUp size={20} />

            <div>

              <h2>
                Monthly Comparison
              </h2>

              <p>
                Compare your spending with last month.
              </p>

            </div>

          </div>


          <div className="month-comparison-card">

            {/* CURRENT MONTH */}

            <div className="month-comparison-item">

              <span>
                {currentMonthName}
              </span>

              <strong>
                {formatMoney(totalSpent)}
              </strong>

            </div>


            <div className="month-comparison-divider">

              <span>
                vs
              </span>

            </div>


            {/* PREVIOUS MONTH */}

            <div className="month-comparison-item">

              <span>
                {previousMonthName}
              </span>

              <strong>
                {formatMoney(previousMonthTotal)}
              </strong>

            </div>

          </div>


          {/* COMPARISON MESSAGE */}

          <div
            className={`month-comparison-message ${
              spendingDifference > 0
                ? "comparison-up"
                : spendingDifference < 0
                ? "comparison-down"
                : "comparison-same"
            }`}
          >

            {previousMonthTotal === 0 ? (

              <>

                <BarChart3 size={18} />

                <span>
                  No spending data from last month to compare.
                </span>

              </>

            ) : spendingDifference > 0 ? (

              <>

                <TrendingUp size={18} />

                <span>
                  You spent{" "}
                  <strong>
                    {formatMoney(
                      Math.abs(
                        spendingDifference
                      )
                    )}
                  </strong>{" "}
                  more than last month{" "}
                  ({Math.round(
                    spendingPercentage
                  )}%).
                </span>

              </>

            ) : spendingDifference < 0 ? (

              <>

                <TrendingDown size={18} />

                <span>
                  You spent{" "}
                  <strong>
                    {formatMoney(
                      Math.abs(
                        spendingDifference
                      )
                    )}
                  </strong>{" "}
                  less than last month{" "}
                  ({Math.round(
                    spendingPercentage
                  )}%).
                </span>

              </>

            ) : (

              <>

                <Wallet size={18} />

                <span>
                  Your spending is the same as last month.
                </span>

              </>

            )}

          </div>

        </section>


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