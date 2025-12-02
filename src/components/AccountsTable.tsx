import { Snapshot } from "../models/snapshot";
import { formatCurrency, formatDate, formatMonthLabel } from "../utils/formatters";

interface AccountsTableProps {
  snapshots: Snapshot[];
}

function AccountsTable({ snapshots }: AccountsTableProps) {
  if (!snapshots.length) {
    return (
      <p className="page-message">לא נמצאו נתוני קופות עבור לקוח זה.</p>
    );
  }

  const groupsByMonth: Record<string, Snapshot[]> = {};

  snapshots.forEach((snapshot) => {
    const rawDate = snapshot.snapshotDate || "";
    const monthKey = rawDate.length >= 7 ? rawDate.slice(0, 7) : "";
    const key = monthKey || "unknown";

    if (!groupsByMonth[key]) {
      groupsByMonth[key] = [];
    }
    groupsByMonth[key].push(snapshot);
  });

  const monthKeys = Object.keys(groupsByMonth).sort().reverse();

  return (
    <div className="table-wrapper">
      <table className="accounts-table">
        <thead>
          <tr>
            <th>תאריך</th>
            <th>סוג קופה</th>
            <th>שם קופה</th>
            <th>מספר קופה</th>
            <th>סכום</th>
          </tr>
        </thead>
        <tbody>
          {monthKeys.map((monthKey) => {
            const monthSnapshots = groupsByMonth[monthKey];
            const monthTotal = monthSnapshots.reduce((sum, snapshot) => {
              const value =
                typeof snapshot.amount === "number" && !Number.isNaN(snapshot.amount)
                  ? snapshot.amount
                  : 0;
              return sum + value;
            }, 0);

            return (
              <>
                <tr key={`month-${monthKey}`} className="accounts-month-row">
                  <td className="accounts-month-label" colSpan={4}>
                    {monthKey === "unknown"
                      ? "ללא חודש"
                      : formatMonthLabel(monthKey)}
                  </td>
                  <td className="accounts-month-total">
                    {formatCurrency(monthTotal)}
                  </td>
                </tr>
                {monthSnapshots.map((snapshot) => (
                  <tr key={`${monthKey}-${snapshot.id}`}>
                    <td>{formatDate(snapshot.snapshotDate)}</td>
                    <td>{snapshot.fundType || ""}</td>
                    <td>{snapshot.fundName || ""}</td>
                    <td>{snapshot.fundNumber || ""}</td>
                    <td>{formatCurrency(snapshot.amount)}</td>
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AccountsTable;
