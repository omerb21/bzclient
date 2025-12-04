import { formatCurrency } from "../utils/formatters";

interface AccountsSummaryProps {
  totalAmount: number;
  fundCount?: number;
  averageAmount?: number;
  trendText?: string | null;
}

function AccountsSummary({
  totalAmount,
  fundCount,
  averageAmount,
  trendText,
}: AccountsSummaryProps) {
  return (
    <div className="accounts-summary">
      <div>
        <div className="accounts-summary-label">סכום כולל בכל הקופות</div>
        <div className="accounts-summary-value">{formatCurrency(totalAmount)}</div>
        {trendText && (
          <div className="accounts-summary-trend">{trendText}</div>
        )}
      </div>
      <div className="accounts-summary-metrics">
        {typeof fundCount === "number" && (
          <div className="accounts-summary-metric">
            <div className="accounts-summary-metric-label">מספר קופות</div>
            <div className="accounts-summary-metric-value">{fundCount}</div>
          </div>
        )}
        {typeof averageAmount === "number" && averageAmount > 0 && (
          <div className="accounts-summary-metric">
            <div className="accounts-summary-metric-label">ממוצע לקופה</div>
            <div className="accounts-summary-metric-value">
              {formatCurrency(averageAmount)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountsSummary;
