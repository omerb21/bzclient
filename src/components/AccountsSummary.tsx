import { formatCurrency, formatDate } from "../utils/formatters";

interface AccountsSummaryProps {
  totalAmount: number;
  fundCount?: number;
  averageAmount?: number;
  trendText?: string | null;
  trendKind?: "up" | "down" | "flat" | null;
  lastUpdatedDate?: string | null;
}

function AccountsSummary({
  totalAmount,
  fundCount,
  averageAmount,
  trendText,
  trendKind,
  lastUpdatedDate,
}: AccountsSummaryProps) {
  const trendClassName = trendKind
    ? `accounts-summary-trend accounts-summary-trend-${trendKind}`
    : "accounts-summary-trend";

  return (
    <div className="accounts-summary">
      <div>
        <div className="accounts-summary-label">סכום כולל בכל הקופות</div>
        <div
          className="accounts-summary-value"
          title="הסכום הכולל של כל הקופות לאחר החלת הפילטרים"
        >
          {formatCurrency(totalAmount)}
        </div>
        {trendText && (
          <div className={trendClassName} title="השוואת הסכום לחודש הקודם">
            {trendText}
          </div>
        )}
        {lastUpdatedDate && (
          <div className="accounts-summary-updated">
            עודכן לאחרונה: {formatDate(lastUpdatedDate)}
          </div>
        )}
      </div>
      <div className="accounts-summary-metrics">
        {typeof fundCount === "number" && (
          <div
            className="accounts-summary-metric"
            title="מספר הקופות שנמצאות כרגע בתצוגה לאחר סינון"
          >
            <div className="accounts-summary-metric-label">מספר קופות</div>
            <div className="accounts-summary-metric-value">{fundCount}</div>
          </div>
        )}
        {typeof averageAmount === "number" && averageAmount > 0 && (
          <div
            className="accounts-summary-metric"
            title="ממוצע = סכום כולל חלקי מספר הקופות המוצגות"
          >
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
