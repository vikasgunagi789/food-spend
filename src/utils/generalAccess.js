const ACCESS_CODE = "vglytics123961";

const ACCESS_KEY =
  "vglytics_general_expenses_unlocked";

export function isGeneralExpensesUnlocked() {
  try {
    return (
      localStorage.getItem(ACCESS_KEY) === "true"
    );
  } catch {
    return false;
  }
}

export function unlockGeneralExpenses(code) {
  if (
    typeof code !== "string" ||
    code.trim() !== ACCESS_CODE
  ) {
    return false;
  }

  try {
    localStorage.setItem(
      ACCESS_KEY,
      "true"
    );

    return true;
  } catch {
    return false;
  }
}

export function lockGeneralExpenses() {
  try {
    localStorage.removeItem(ACCESS_KEY);
  } catch {
    // Ignore storage errors
  }
}