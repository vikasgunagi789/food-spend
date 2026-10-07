import {
  AlertTriangle,
  CheckCircle2,
  Info,
  WalletCards,
} from "lucide-react";

function BudgetAlert({ alert }) {
  if (!alert) {
    return null;
  }

  const Icon =
    alert.type === "danger"
      ? AlertTriangle
      : alert.type === "warning"
      ? AlertTriangle
      : alert.type === "info"
      ? Info
      : CheckCircle2;

  return (
    <section
      className={`budget-alert-card budget-alert-${alert.type}`}
    >

      <div className="budget-alert-icon">
        <Icon size={20} />
      </div>

      <div className="budget-alert-content">

        <div className="budget-alert-heading">

          <div>
            <span>
              Smart Budget
            </span>

            <h3>
              {alert.title}
            </h3>
          </div>

          <WalletCards
            size={18}
            className="budget-alert-wallet"
          />

        </div>

        <p>
          {alert.message}
        </p>

        <div className="budget-alert-progress">

          <div className="budget-alert-progress-track">

            <div
              className="budget-alert-progress-fill"
              style={{
                width: `${Math.min(
                  alert.percentage,
                  100
                )}%`,
              }}
            />

          </div>

          <strong>
            {Math.min(
              alert.percentage,
              100
            )}%
          </strong>

        </div>

      </div>

    </section>
  );
}

export default BudgetAlert;