// =========================
// SMART BUDGET ALERTS
// =========================

function formatMoney(amount) {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN")}`;
}

export function getBudgetAlert(
  monthlySpent = 0,
  budget = 6000
) {
  if (!budget || budget <= 0) {
    return null;
  }

  const percentage =
    (monthlySpent / budget) * 100;

  const remaining =
    Math.max(budget - monthlySpent, 0);

  // Budget exceeded
  if (monthlySpent > budget) {
    return {
      type: "danger",
      title: "Budget exceeded",
      message:
        `You've exceeded your monthly budget by ${formatMoney(
          monthlySpent - budget
        )}.`,
      percentage: Math.round(percentage),
      remaining: 0,
    };
  }

  // 90% or more
  if (percentage >= 90) {
    return {
      type: "warning",
      title: "Budget almost reached",
      message:
        `You've used ${Math.round(
          percentage
        )}% of your budget. Only ${formatMoney(
          remaining
        )} is remaining.`,
      percentage: Math.round(percentage),
      remaining,
    };
  }

  // 80% or more
  if (percentage >= 80) {
    return {
      type: "warning",
      title: "Budget alert",
      message:
        `You've used ${Math.round(
          percentage
        )}% of your monthly budget. ${formatMoney(
          remaining
        )} is remaining.`,
      percentage: Math.round(percentage),
      remaining,
    };
  }

  // 50% or more
  if (percentage >= 50) {
    return {
      type: "info",
      title: "Budget update",
      message:
        `You've used ${Math.round(
          percentage
        )}% of your monthly budget. You have ${formatMoney(
          remaining
        )} left.`,
      percentage: Math.round(percentage),
      remaining,
    };
  }

  // Below 50%
  return {
    type: "success",
    title: "Budget on track",
    message:
      `You've used ${Math.round(
        percentage
      )}% of your monthly budget. ${formatMoney(
        remaining
      )} is still available.`,
    percentage: Math.round(percentage),
    remaining,
  };
}