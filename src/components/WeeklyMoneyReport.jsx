import {
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Receipt,
  Wallet,
  BarChart3,
} from "lucide-react";

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

function WeeklyMoneyReport({
  report,
}) {
  if (!report) {
    return null;
  }

  const {
    startDate,
    endDate,
    total,
    previousTotal,
    percentageChange,
    averageDaily,
    expenseCount,
    dailyData,
    highestDay,
    highestCategory,
    hasData,
  } = report;

  const spendingIncreased =
    percentageChange > 0;

  const spendingDecreased =
    percentageChange < 0;

  const maxDailyAmount =
    Math.max(
      ...dailyData.map(
        (day) => day.amount
      ),
      1
    );

  return (
    <section className="weekly-report-card">

      {/* =========================
          HEADER
          ========================= */}

      <div className="weekly-report-header">

        <div className="weekly-report-title">

          <div className="weekly-report-icon">
            <CalendarDays size={21} />
          </div>

          <div>
            <p>
              Weekly Money Report
            </p>

            <h2>
              This Week
            </h2>
          </div>

        </div>

        <div className="weekly-report-date">
          {formatDate(startDate)}
          {" – "}
          {formatDate(endDate)}
        </div>

      </div>


      {/* =========================
          EMPTY STATE
          ========================= */}

      {!hasData ? (
        <div className="weekly-empty">

          <BarChart3 size={32} />

          <h3>
            No spending this week
          </h3>

          <p>
            Add your food expenses and
            VGlytics will build your
            weekly report automatically.
          </p>

        </div>
      ) : (
        <>

          {/* =========================
              MAIN TOTAL
              ========================= */}

          <div className="weekly-main-total">

            <span>
              Total spent
            </span>

            <strong>
              {formatMoney(total)}
            </strong>

            {previousTotal > 0 && (
              <div
                className={
                  spendingIncreased
                    ? "weekly-change increased"
                    : "weekly-change decreased"
                }
              >

                {spendingIncreased ? (
                  <TrendingUp size={15} />
                ) : (
                  <TrendingDown size={15} />
                )}

                {Math.abs(
                  percentageChange
                ).toFixed(0)}
                %{" "}

                {spendingIncreased
                  ? "more"
                  : "less"}{" "}
                than last week

              </div>
            )}

          </div>


          {/* =========================
              SUMMARY STATS
              ========================= */}

          <div className="weekly-summary-grid">

            <div className="weekly-summary-item">

              <div className="weekly-summary-icon">
                <Wallet size={17} />
              </div>

              <div>
                <span>
                  Daily average
                </span>

                <strong>
                  {formatMoney(
                    averageDaily
                  )}
                </strong>
              </div>

            </div>


            <div className="weekly-summary-item">

              <div className="weekly-summary-icon">
                <Receipt size={17} />
              </div>

              <div>
                <span>
                  Expenses
                </span>

                <strong>
                  {expenseCount}
                </strong>
              </div>

            </div>


            <div className="weekly-summary-item">

              <div className="weekly-summary-icon">
                <TrendingUp size={17} />
              </div>

              <div>
                <span>
                  Highest day
                </span>

                <strong>
                  {highestDay
                    ? formatMoney(
                        highestDay.amount
                      )
                    : "₹0"}
                </strong>
              </div>

            </div>


            <div className="weekly-summary-item">

              <div className="weekly-summary-icon">
                <BarChart3 size={17} />
              </div>

              <div>
                <span>
                  Top category
                </span>

                <strong>
                  {highestCategory
                    ? highestCategory.category
                    : "—"}
                </strong>
              </div>

            </div>

          </div>


          {/* =========================
              DAILY CHART
              ========================= */}

          <div className="weekly-chart-section">

            <div className="weekly-chart-heading">

              <div>
                <h3>
                  Daily spending
                </h3>

                <p>
                  Your spending across
                  the last 7 days
                </p>
              </div>

            </div>


            <div className="weekly-bars">

              {dailyData.map(
                (day) => {
                  const height =
                    day.amount > 0
                      ? Math.max(
                          (
                            day.amount /
                            maxDailyAmount
                          ) * 100,
                          8
                        )
                      : 4;

                  return (
                    <div
                      className="weekly-bar-column"
                      key={day.date}
                    >

                      <div className="weekly-bar-value">
                        {day.amount > 0
                          ? formatMoney(
                              day.amount
                            )
                          : ""}
                      </div>

                      <div className="weekly-bar-track">

                        <div
                          className={
                            day.amount > 0
                              ? "weekly-bar-fill"
                              : "weekly-bar-fill empty"
                          }
                          style={{
                            height:
                              `${height}%`,
                          }}
                        />

                      </div>

                      <span>
                        {day.label}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>


          {/* =========================
              TOP CATEGORY
              ========================= */}

          {highestCategory && (
            <div className="weekly-highlight">

              <div className="weekly-highlight-icon">
                <BarChart3 size={18} />
              </div>

              <div>

                <span>
                  Highest spending category
                </span>

                <strong>
                  {highestCategory.category}
                  {" · "}
                  {formatMoney(
                    highestCategory.amount
                  )}
                </strong>

              </div>

            </div>
          )}

        </>
      )}

    </section>
  );
}

export default WeeklyMoneyReport;