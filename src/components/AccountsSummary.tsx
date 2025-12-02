import { formatCurrency } from "../utils/formatters";

interface AccountsSummaryProps {
  totalAmount: number;
}

function AccountsSummary({ totalAmount }: AccountsSummaryProps) {
  return (
    <div className="accounts-summary">
      <div className="accounts-summary-label">סכום כולל בכל הקופות</div>
      <div className="accounts-summary-value">{formatCurrency(totalAmount)}</div>
    </div>
  );
}

export default AccountsSummary;
