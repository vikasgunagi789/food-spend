
const INGREDIENT_STORAGE_KEY = "foodspend_ingredients";

// =====================================================
// GET ALL INGREDIENT DATA
// =====================================================

export function getIngredientData() {
  try {
    const saved = localStorage.getItem(
      INGREDIENT_STORAGE_KEY
    );

    if (!saved) {
      return {
        purchases: [],
        usages: [],
      };
    }

    const parsed = JSON.parse(saved);

    return {
      purchases: Array.isArray(parsed.purchases)
        ? parsed.purchases
        : [],
      usages: Array.isArray(parsed.usages)
        ? parsed.usages
        : [],
    };
  } catch (error) {
    console.error("Unable to read ingredient data:", error);

    return {
      purchases: [],
      usages: [],
    };
  }
}

// =====================================================
// SAVE INGREDIENT DATA
// =====================================================

function saveIngredientData(data) {
  try {
    localStorage.setItem(
      INGREDIENT_STORAGE_KEY,
      JSON.stringify(data)
    );

    window.dispatchEvent(
      new Event("ingredientsUpdated")
    );

    return true;
  } catch (error) {
    console.error("Unable to save ingredient data:", error);
    return false;
  }
}

// =====================================================
// GET INGREDIENT PURCHASES
// =====================================================

export function getIngredientPurchases() {
  return getIngredientData().purchases;
}

// =====================================================
// GET INGREDIENT USAGES
// =====================================================

export function getIngredientUsages() {
  return getIngredientData().usages;
}

// =====================================================
// ADD INGREDIENT PURCHASE
// =====================================================

export function addIngredientPurchase({
  name,
  quantity,
  unit,
  purchasePrice,
  date,
}) {
  if (!name?.trim()) {
    throw new Error("Ingredient name is required.");
  }

  if (
    !Number.isFinite(Number(quantity)) ||
    Number(quantity) <= 0
  ) {
    throw new Error("Enter a valid quantity.");
  }

  if (
    !Number.isFinite(Number(purchasePrice)) ||
    Number(purchasePrice) <= 0
  ) {
    throw new Error("Enter a valid purchase price.");
  }

  const data = getIngredientData();

  const purchase = {
    id:
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`,

    name: name.trim(),
    quantity: Number(quantity),
    remainingQuantity: Number(quantity),
    unit: unit || "pieces",
    purchasePrice: Number(purchasePrice),
    date: date || new Date().toISOString().slice(0, 10),

    status: "active",
    usageCount: 0,
    costPerUse: null,

    createdAt: new Date().toISOString(),
  };

  data.purchases.push(purchase);

  if (!saveIngredientData(data)) {
    throw new Error("Unable to save ingredient purchase.");
  }

  return purchase;
}

// =====================================================
// RECALCULATE COST FOR ALL USES OF AN INGREDIENT
// =====================================================

function recalculateIngredientCost(data, purchaseId) {
  const purchase = data.purchases.find(
    (item) => item.id === purchaseId
  );

  if (!purchase) {
    throw new Error("Ingredient purchase not found.");
  }

  const usages = data.usages.filter(
    (usage) => usage.purchaseId === purchaseId
  );

  const usageCount = usages.length;

  const costPerUse =
    usageCount > 0
      ? Number(
          (purchase.purchasePrice / usageCount).toFixed(2)
        )
      : null;

  let allocatedTotal = 0;

  data.usages = data.usages.map((usage) => {
    if (usage.purchaseId !== purchaseId) {
      return usage;
    }

    const updatedUsage = {
      ...usage,
      allocatedCost: costPerUse,
    };

    allocatedTotal += costPerUse || 0;

    return updatedUsage;
  });

  // Correct the final usage for rounding differences.
  if (usageCount > 0) {
    const lastUsageIndex = data.usages.findLastIndex(
      (usage) => usage.purchaseId === purchaseId
    );

    const difference = Number(
      (purchase.purchasePrice - allocatedTotal).toFixed(2)
    );

    if (lastUsageIndex !== -1 && difference !== 0) {
      data.usages[lastUsageIndex].allocatedCost = Number(
        (
          data.usages[lastUsageIndex].allocatedCost +
          difference
        ).toFixed(2)
      );
    }
  }

  purchase.usageCount = usageCount;
  purchase.costPerUse = costPerUse;

  return {
    purchase,
    usageCount,
    costPerUse,
  };
}

// =====================================================
// RECORD INGREDIENT USAGE
// =====================================================

export function recordIngredientUsage({
  purchaseId,
  expenseId,
  foodName,
  date,
}) {
  const data = getIngredientData();

  const purchase = data.purchases.find(
    (item) => item.id === purchaseId
  );

  if (!purchase) {
    throw new Error("Ingredient purchase not found.");
  }

  if (purchase.status !== "active") {
    throw new Error(
      "This ingredient purchase has already been finalized."
    );
  }

  if (!expenseId) {
    throw new Error("Expense ID is required.");
  }

  // Prevent duplicate selection for the same expense.
  const alreadyRecorded = data.usages.some(
    (usage) =>
      usage.purchaseId === purchaseId &&
      usage.expenseId === expenseId
  );

  if (alreadyRecorded) {
    throw new Error(
      "This ingredient is already linked to this expense."
    );
  }

  const usage = {
    id:
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`,

    purchaseId,
    expenseId,
    foodName: foodName || "Food item",

    date: date || new Date().toISOString().slice(0, 10),

    allocatedCost: null,
    finalized: false,

    createdAt: new Date().toISOString(),
  };

  data.usages.push(usage);

  // Recalculate the cost of every previous and new usage.
  const result = recalculateIngredientCost(
    data,
    purchaseId
  );

  if (!saveIngredientData(data)) {
    throw new Error("Unable to save ingredient usage.");
  }

  return {
    usage: data.usages.find(
      (item) => item.id === usage.id
    ),
    ...result,
  };
}

// =====================================================
// MARK INGREDIENT EMPTY AND FINALIZE COST
// =====================================================

export function markIngredientEmpty(purchaseId) {
  const data = getIngredientData();

  const purchase = data.purchases.find(
    (item) => item.id === purchaseId
  );

  if (!purchase) {
    throw new Error("Ingredient purchase not found.");
  }

  if (purchase.status === "empty") {
    throw new Error("This purchase is already finalized.");
  }

  const result = recalculateIngredientCost(
    data,
    purchaseId
  );

  data.usages = data.usages.map((usage) => {
    if (usage.purchaseId !== purchaseId) {
      return usage;
    }

    return {
      ...usage,
      finalized: true,
    };
  });

  purchase.status = "empty";
  purchase.emptiedAt = new Date().toISOString();

  if (!saveIngredientData(data)) {
    throw new Error("Unable to finalize ingredient.");
  }

  return result;
}
