
import { useEffect, useState } from "react";

import "../styles/ingredients.css";

import {
  Plus,
  Package,
  Trash2,
  CheckCircle,
  Archive,
} from "lucide-react";

import {
  getIngredientPurchases,
  addIngredientPurchase,
  markIngredientEmpty,
} from "../services/ingredientService";

function Ingredients() {
  const [purchases, setPurchases] = useState([]);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [showForm, setShowForm] = useState(false);

  function loadPurchases() {
    setPurchases(getIngredientPurchases());
  }

  useEffect(() => {
    loadPurchases();

    window.addEventListener(
      "ingredientsUpdated",
      loadPurchases
    );

    return () => {
      window.removeEventListener(
        "ingredientsUpdated",
        loadPurchases
      );
    };
  }, []);

  function handleAddIngredient(e) {
    e.preventDefault();

    try {
      addIngredientPurchase({
        name,
        quantity,
        unit,
        purchasePrice,
        date,
      });

      setName("");
      setQuantity("");
      setUnit("pieces");
      setPurchasePrice("");
      setDate(new Date().toISOString().slice(0, 10));

      setShowForm(false);
      loadPurchases();

      alert("Ingredient purchase added successfully!");
    } catch (error) {
      alert(error.message);
    }
  }

  function handleMarkEmpty(purchase) {
    const confirmed = window.confirm(
      `Mark ${purchase.name} as empty?\n\n` +
      `This will finalize its cost allocation across ` +
      `all recorded food uses.`
    );

    if (!confirmed) return;

    try {
      const result = markIngredientEmpty(purchase.id);

      loadPurchases();

      if (result.usageCount > 0) {
        alert(
          `${purchase.name} finalized successfully!\n\n` +
          `Recorded uses: ${result.usageCount}\n` +
          `Cost per use: ₹${result.costPerUse.toFixed(2)}`
        );
      } else {
        alert(
          `${purchase.name} marked as empty.\n` +
          `No recorded uses were available for cost allocation.`
        );
      }
    } catch (error) {
      alert(error.message);
    }
  }

  const activePurchases = purchases.filter(
    (item) => item.status === "active"
  );

  const completedPurchases = purchases.filter(
    (item) => item.status === "empty"
  );

  return (
    <div className="page ingredients-page">

      <div className="page-header">
        <div>
          <p className="page-kicker">VGlytics</p>
          <h1>Ingredient Inventory</h1>
          <p>
            Manage your purchased ingredients and track
            their food costs.
          </p>
        </div>

        <button
          className="add-ingredient-button"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          Add Ingredient
        </button>
      </div>

      {showForm && (
        <form
          className="ingredient-form"
          onSubmit={handleAddIngredient}
        >
          <h2>Add Purchased Ingredient</h2>

          <div className="form-group">
            <label>Ingredient name</label>
            <input
              type="text"
              placeholder="e.g. Sugar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Quantity purchased</label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 1"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="pieces">Pieces</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="litres">Litres</option>
              <option value="ml">Millilitres (ml)</option>
              <option value="packets">Packets</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Purchase price (₹)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 50"
              value={purchasePrice}
              onChange={(e) =>
                setPurchasePrice(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Purchase date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="ingredient-form-actions">
            <button type="submit">
              Save Purchase
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="ingredient-section">
        <div className="ingredient-section-title">
          <Package size={20} />
          <h2>Available Ingredients</h2>
          <span>{activePurchases.length}</span>
        </div>

        {activePurchases.length === 0 ? (
          <div className="ingredient-empty-state">
            <Package size={36} />
            <h3>No ingredients added yet</h3>
            <p>
              Add your first purchase to start tracking
              your ingredient inventory.
            </p>
          </div>
        ) : (
          <div className="ingredient-grid">
            {activePurchases.map((item) => (
              <div
                className="ingredient-card"
                key={item.id}
              >
                <div className="ingredient-card-header">
                  <div>
                    <h3>{item.name}</h3>
                    <span className="ingredient-status">
                      Active
                    </span>
                  </div>

                  <Package size={23} />
                </div>

                <div className="ingredient-details">
                  <p>
                    Quantity:{" "}
                    <strong>
                      {item.quantity} {item.unit}
                    </strong>
                  </p>

                  <p>
                    Purchase price:{" "}
                    <strong>
                      ₹{item.purchasePrice.toFixed(2)}
                    </strong>
                  </p>

                  <p>
                    Recorded uses:{" "}
                    <strong>{item.usageCount}</strong>
                  </p>

                  <p>
                    Purchase date:{" "}
                    <strong>{item.date}</strong>
                  </p>
                </div>

                <button
                  className="mark-empty-button"
                  onClick={() => handleMarkEmpty(item)}
                >
                  <CheckCircle size={17} />
                  Mark Empty
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ingredient-section">
        <div className="ingredient-section-title">
          <Archive size={20} />
          <h2>Purchase History</h2>
          <span>{completedPurchases.length}</span>
        </div>

        {completedPurchases.length === 0 ? (
          <p className="ingredient-history-empty">
            No finalized purchases yet.
          </p>
        ) : (
          <div className="ingredient-grid">
            {completedPurchases.map((item) => (
              <div
                className="ingredient-card completed"
                key={item.id}
              >
                <div className="ingredient-card-header">
                  <div>
                    <h3>{item.name}</h3>
                    <span className="ingredient-status completed-status">
                      Finalized
                    </span>
                  </div>

                  <CheckCircle size={23} />
                </div>

                <div className="ingredient-details">
                  <p>
                    Purchased quantity:{" "}
                    <strong>
                      {item.quantity} {item.unit}
                    </strong>
                  </p>

                  <p>
                    Purchase price:{" "}
                    <strong>
                      ₹{item.purchasePrice.toFixed(2)}
                    </strong>
                  </p>

                  <p>
                    Total recorded uses:{" "}
                    <strong>{item.usageCount}</strong>
                  </p>

                  <p>
                    Cost per use:{" "}
                    <strong>
                      {item.costPerUse === null
                        ? "No recorded uses"
                        : `₹${item.costPerUse.toFixed(2)}`}
                    </strong>
                  </p>

                  <p>
                    Finalized on:{" "}
                    <strong>
                      {item.emptiedAt
                        ? new Date(
                            item.emptiedAt
                          ).toLocaleDateString()
                        : "-"}
                    </strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default Ingredients;
