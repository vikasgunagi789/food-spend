import {
  Coffee,
  Utensils,
  Moon,
  Cookie,
  CupSoda,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

const categoryIcons = {
  Breakfast: Coffee,
  Lunch: Utensils,
  Dinner: Moon,
  Snacks: Cookie,
  Drinks: CupSoda,
  Other: MoreHorizontal,
};

function ExpenseCard({ expense, onEdit, onDelete }) {
  const Icon = categoryIcons[expense.category] || MoreHorizontal;

  return (
    <div className="expense-card">
      <div className="expense-card-left">
        <div className="expense-category-icon">
          <Icon size={19} />
        </div>

        <div className="expense-details">
          <h3>{expense.itemName}</h3>

          <div className="expense-meta">
            <span className="category-badge">
              {expense.category}
            </span>

            {expense.note && (
              <span className="expense-note">
                {expense.note}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="expense-card-right">
        <strong>₹{Number(expense.amount)}</strong>

        <div className="expense-actions">
          <button
            type="button"
            className="expense-action edit"
            onClick={() => onEdit(expense)}
            aria-label="Edit expense"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            className="expense-action delete"
            onClick={() => onDelete(expense.id)}
            aria-label="Delete expense"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExpenseCard;