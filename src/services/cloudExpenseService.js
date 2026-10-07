import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import {
  getExpenses,
  replaceExpenses,
  getBudget,
  setBudget,
  backupLocalExpenses,
} from "./expenseService";

// =====================================================
// FIRESTORE EXPENSE PATH
// =====================================================

function getExpenseCollection(userId) {
  return collection(
    db,
    "users",
    userId,
    "expenses"
  );
}

// =====================================================
// GET CLOUD EXPENSES
// =====================================================

export async function getCloudExpenses(user) {
  if (!user) return [];

  try {
    const expensesRef =
      getExpenseCollection(user.uid);

    const snapshot = await getDocs(expensesRef);

    return snapshot.docs.map((expenseDoc) => {
      const data = expenseDoc.data();

      return {
        id: expenseDoc.id,

        itemName: data.itemName || "",

        amount: Number(data.amount || 0),

        category:
          data.category || "Other",

        date: data.date || "",

        note: data.note || "",

        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          data.createdAt ||
          "",
      };
    });
  } catch (error) {
    console.error(
      "Unable to get cloud expenses:",
      error
    );

    throw error;
  }
}

// =====================================================
// ADD CLOUD EXPENSE
// =====================================================

export async function addCloudExpense(
  user,
  expense
) {
  if (!user) {
    throw new Error(
      "User must be logged in to save cloud expenses."
    );
  }

  try {
    const expenseId =
      expense.id ||
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`;

    const expenseRef = doc(
      getExpenseCollection(user.uid),
      expenseId
    );

    const cloudExpense = {
      itemName: expense.itemName || "",

      amount: Number(
        expense.amount || 0
      ),

      category:
        expense.category || "Other",

      date: expense.date || "",

      note: expense.note || "",

      createdAt:
        expense.createdAt ||
        serverTimestamp(),
    };

    await setDoc(
      expenseRef,
      cloudExpense,
      {
        merge: true,
      }
    );

    return {
      id: expenseId,
      ...cloudExpense,
    };
  } catch (error) {
    console.error(
      "Unable to save cloud expense:",
      error
    );

    throw error;
  }
}

// =====================================================
// UPDATE CLOUD EXPENSE
// =====================================================

export async function updateCloudExpense(
  user,
  expenseId,
  updatedExpense
) {
  if (!user) {
    throw new Error(
      "User must be logged in to update cloud expenses."
    );
  }

  try {
    const expenseRef = doc(
      getExpenseCollection(user.uid),
      expenseId
    );

    await updateDoc(expenseRef, {
      itemName:
        updatedExpense.itemName || "",

      amount: Number(
        updatedExpense.amount || 0
      ),

      category:
        updatedExpense.category ||
        "Other",

      date:
        updatedExpense.date || "",

      note:
        updatedExpense.note || "",
    });
  } catch (error) {
    console.error(
      "Unable to update cloud expense:",
      error
    );

    throw error;
  }
}

// =====================================================
// DELETE CLOUD EXPENSE
// =====================================================

export async function deleteCloudExpense(
  user,
  expenseId
) {
  if (!user) {
    throw new Error(
      "User must be logged in to delete cloud expenses."
    );
  }

  try {
    const expenseRef = doc(
      getExpenseCollection(user.uid),
      expenseId
    );

    await deleteDoc(expenseRef);
  } catch (error) {
    console.error(
      "Unable to delete cloud expense:",
      error
    );

    throw error;
  }
}

// =====================================================
// UPLOAD LOCAL EXPENSES
// =====================================================

export async function uploadLocalExpenses(
  user,
  localExpenses
) {
  if (!user) {
    throw new Error(
      "User must be logged in to upload expenses."
    );
  }

  if (!Array.isArray(localExpenses)) {
    return [];
  }

  try {
    for (const expense of localExpenses) {
      await addCloudExpense(
        user,
        expense
      );
    }

    return await getCloudExpenses(user);
  } catch (error) {
    console.error(
      "Unable to upload local expenses:",
      error
    );

    throw error;
  }
}

// =====================================================
// SAFE LOCAL + CLOUD SYNC
// =====================================================
//
// IMPORTANT:
//
// LOCAL DATA IS NEVER DELETED JUST BECAUSE
// FIREBASE CONTAINS FEWER RECORDS.
//
// Local + Firebase are merged using the expense ID.
//
// =====================================================

export async function syncExpenses(user) {
  // ===================================================
  // LOGGED OUT
  // ===================================================
  //
  // IMPORTANT:
  // Logging out must NOT touch local expenses.
  //
  // ===================================================

  if (!user) {
    return getExpenses();
  }

  try {
    // =================================================
    // STEP 1
    // BACK UP CURRENT LOCAL DATA
    // =================================================

    backupLocalExpenses();

    // =================================================
    // STEP 2
    // READ LOCAL DATA
    // =================================================

    const localExpenses =
      getExpenses();

    // =================================================
    // STEP 3
    // READ FIREBASE DATA
    // =================================================

    const cloudExpenses =
      await getCloudExpenses(user);

    console.log(
      "VGlytics sync:",
      "Local:",
      localExpenses.length,
      "Cloud:",
      cloudExpenses.length
    );

    // =================================================
    // STEP 4
    // MERGE BOTH DATASETS
    // =================================================

    const expenseMap = new Map();

    // Add Firebase expenses
    for (const expense of cloudExpenses) {
      expenseMap.set(
        expense.id,
        expense
      );
    }

    // Add local expenses
    //
    // If Firebase doesn't have the local ID,
    // the local expense is preserved.

    for (const expense of localExpenses) {
      if (!expenseMap.has(expense.id)) {
        expenseMap.set(
          expense.id,
          expense
        );
      }
    }

    const mergedExpenses =
      Array.from(
        expenseMap.values()
      );

    // =================================================
    // STEP 5
    // FIND LOCAL EXPENSES MISSING FROM FIREBASE
    // =================================================

    const cloudIds = new Set(
      cloudExpenses.map(
        (expense) => expense.id
      )
    );

    const missingCloudExpenses =
      localExpenses.filter(
        (expense) =>
          !cloudIds.has(expense.id)
      );

    // =================================================
    // STEP 6
    // UPLOAD MISSING LOCAL EXPENSES
    // =================================================

    if (
      missingCloudExpenses.length > 0
    ) {
      console.log(
        "VGlytics: uploading missing local expenses:",
        missingCloudExpenses.length
      );

      for (const expense of missingCloudExpenses) {
        await addCloudExpense(
          user,
          expense
        );
      }
    }

    // =================================================
    // STEP 7
    // READ FIREBASE AGAIN
    // =================================================

    const finalCloudExpenses =
      await getCloudExpenses(user);

    // =================================================
    // STEP 8
    // FINAL SAFE MERGE
    // =================================================

    const finalMap = new Map();

    // Firebase records
    for (const expense of finalCloudExpenses) {
      finalMap.set(
        expense.id,
        expense
      );
    }

    // Previously merged local records
    //
    // If Firebase somehow failed to return one,
    // preserve the local copy.

    for (const expense of mergedExpenses) {
      if (!finalMap.has(expense.id)) {
        finalMap.set(
          expense.id,
          expense
        );
      }
    }

    const safeFinalExpenses =
      Array.from(
        finalMap.values()
      );

    // =================================================
    // STEP 9
    // SAVE FINAL MERGED DATA LOCALLY
    // =================================================

    replaceExpenses(
      safeFinalExpenses
    );

    console.log(
      "VGlytics: sync completed.",
      "Final expenses:",
      safeFinalExpenses.length
    );

    return safeFinalExpenses;

  } catch (error) {
    console.error(
      "Expense synchronization failed:",
      error
    );

    // =================================================
    // IMPORTANT SAFETY RULE
    //
    // If Firebase sync fails, DO NOT replace
    // local expenses with anything.
    // =================================================

    return getExpenses();
  }
}

// =====================================================
// MONTHLY BUDGET CLOUD SYNC
// =====================================================

const SETTINGS_DOC_ID = "main";

function getSettingsDocument(userId) {
  return doc(
    db,
    "users",
    userId,
    "settings",
    SETTINGS_DOC_ID
  );
}

// =====================================================
// GET CLOUD BUDGET
// =====================================================

export async function getCloudBudget(user) {
  if (!user) return null;

  try {
    const settingsRef =
      getSettingsDocument(
        user.uid
      );

    const snapshot =
      await getDoc(settingsRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data =
      snapshot.data();

    const budget =
      Number(data.monthlyBudget);

    if (
      !Number.isFinite(budget) ||
      budget <= 0
    ) {
      return null;
    }

    return budget;
  } catch (error) {
    console.error(
      "Unable to get cloud budget:",
      error
    );

    throw error;
  }
}

// =====================================================
// SET CLOUD BUDGET
// =====================================================

export async function setCloudBudget(
  user,
  amount
) {
  if (!user) {
    throw new Error(
      "User must be logged in to save budget."
    );
  }

  const budget =
    Number(amount);

  if (
    !Number.isFinite(budget) ||
    budget <= 0
  ) {
    throw new Error(
      "Invalid budget."
    );
  }

  try {
    const settingsRef =
      getSettingsDocument(
        user.uid
      );

    await setDoc(
      settingsRef,
      {
        monthlyBudget:
          budget,

        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return budget;
  } catch (error) {
    console.error(
      "Unable to save cloud budget:",
      error
    );

    throw error;
  }
}

// =====================================================
// SYNC BUDGET
// =====================================================

export async function syncBudget(user) {
  if (!user) {
    return getBudget();
  }

  try {
    const localBudget =
      getBudget();

    const cloudBudget =
      await getCloudBudget(user);

    // Firebase budget exists
    if (cloudBudget !== null) {
      setBudget(
        cloudBudget
      );

      return cloudBudget;
    }

    // Firebase budget doesn't exist yet
    await setCloudBudget(
      user,
      localBudget
    );

    return localBudget;

  } catch (error) {
    console.error(
      "Budget synchronization failed:",
      error
    );

    // Keep local budget if cloud sync fails
    return getBudget();
  }
}