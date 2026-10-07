const categories = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
  snacks: "Snacks",
  drink: "Drinks",
  drinks: "Drinks",
};

function detectCategory(text) {
  const lower = text.toLowerCase();

  for (const [keyword, category] of Object.entries(
    categories
  )) {
    if (lower.includes(keyword)) {
      return category;
    }
  }

  // Common food clues
  if (
    /dosa|idli|poha|upma|paratha|breakfast/.test(
      lower
    )
  ) {
    return "Breakfast";
  }

  if (
    /biryani|rice|roti|chapati|thali|lunch/.test(
      lower
    )
  ) {
    return "Lunch";
  }

  if (
    /dinner|meal/.test(lower)
  ) {
    return "Dinner";
  }

  if (
    /tea|coffee|juice|milk|drink/.test(
      lower
    )
  ) {
    return "Drinks";
  }

  if (
    /chips|biscuit|cookie|snack/.test(
      lower
    )
  ) {
    return "Snacks";
  }

  return "Other";
}


function detectAmount(text) {
  const lower = text.toLowerCase();

  // ₹150 / ₹ 150
  const rupeeSymbol = lower.match(
    /₹\s*(\d+(?:\.\d+)?)/
  );

  if (rupeeSymbol) {
    return Number(rupeeSymbol[1]);
  }

  // "150 rupees"
  const rupees = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:rupees|rupee|rs)\b/
  );

  if (rupees) {
    return Number(rupees[1]);
  }

  // "for 150"
  const forAmount = lower.match(
    /\bfor\s+(\d+(?:\.\d+)?)\b/
  );

  if (forAmount) {
    return Number(forAmount[1]);
  }

  // Fallback: any number
  const number = lower.match(
    /\b(\d+(?:\.\d+)?)\b/
  );

  return number
    ? Number(number[1])
    : null;
}


function detectItem(text) {
  let item = text.trim();

  // Remove amount expressions
  item = item.replace(
    /₹\s*\d+(?:\.\d+)?/gi,
    ""
  );

  item = item.replace(
    /\d+(?:\.\d+)?\s*(?:rupees|rupee|rs)\b/gi,
    ""
  );

  item = item.replace(
    /\bfor\s+\d+(?:\.\d+)?\b/gi,
    ""
  );

  // Remove common sentence words
  item = item.replace(
    /\b(i|had|ate|eaten|bought|got|spent|paid|my|today|this|cost|me|on|for)\b/gi,
    ""
  );

  item = item
    .replace(/\s+/g, " ")
    .trim();

  // Remove category words
  item = item.replace(
    /\b(breakfast|lunch|dinner|snacks?|drinks?)\b/gi,
    ""
  );

  item = item
    .replace(/\s+/g, " ")
    .trim();

  if (!item) {
    return "Food";
  }

  return item
    .charAt(0)
    .toUpperCase() +
    item.slice(1);
}


export function parseVoiceExpense(text) {
  const amount = detectAmount(text);
  const category = detectCategory(text);
  const itemName = detectItem(text);

  if (!amount || amount <= 0) {
    return {
      success: false,
      error:
        "I couldn't find the amount. Try saying something like 'dosa for 80 rupees'.",
    };
  }

  return {
    success: true,

    expense: {
      itemName,
      amount,
      category,
      date: getTodayKey(),
      note: "Added using voice",
    },
  };
}


function getTodayKey() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}