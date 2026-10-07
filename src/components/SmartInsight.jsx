import {
  Lightbulb,
  ArrowUpRight,
} from "lucide-react";

function SmartInsight({
  insight,
  onViewStatistics,
}) {
  if (!insight) {
    return null;
  }

  return (
    <section className="smart-insight-card">
      <div className="smart-insight-top">
        <div className="smart-insight-icon">
          <Lightbulb size={20} />
        </div>

        <div className="smart-insight-heading">
          <span>VGlytics Insight</span>
          <h3>{insight.title}</h3>
        </div>
      </div>

      <p className="smart-insight-message">
        {insight.message}
      </p>

      {onViewStatistics && (
        <button
          type="button"
          className="smart-insight-link"
          onClick={onViewStatistics}
        >
          View statistics
          <ArrowUpRight size={16} />
        </button>
      )}
    </section>
  );
}

export default SmartInsight;