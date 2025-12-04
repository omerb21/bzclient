import { useMemo, useState } from "react";
import { Snapshot } from "../models/snapshot";
import { formatCurrency, formatDate, formatMonthLabel } from "../utils/formatters";

interface AccountsTableProps {
  snapshots: Snapshot[];
}

type SortField = "date" | "amount" | null;
type SortDirection = "asc" | "desc";

function AccountsTable({ snapshots }: AccountsTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const hasSnapshots = snapshots.length > 0;

  const { groupsByMonth, monthKeys } = useMemo(() => {
    const groups: Record<string, Snapshot[]> = {};

    snapshots.forEach((snapshot) => {
      const rawDate = snapshot.snapshotDate || "";
      const monthKey = rawDate.length >= 7 ? rawDate.slice(0, 7) : "";
      const key = monthKey || "unknown";

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(snapshot);
    });

    const keys = Object.keys(groups).sort().reverse();

    return { groupsByMonth: groups, monthKeys: keys };
  }, [snapshots]);

  const handleSort = (field: SortField) => {
    if (!field) {
      return;
    }

    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc"
        );
        return currentField;
      }

      setSortDirection("asc");
      return field;
    });
  };

  if (!hasSnapshots) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">אין נתוני קופות להצגה.</div>
        <div className="empty-state-text">
          ייתכן שהנתונים עדיין בתהליך עדכון במערכת BEN-ZVI, או שאין כרגע נתונים זמינים
          עבור קופות ללקוח זה.
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="accounts-table">
        <thead>
          <tr>
            <th
              className="sortable-header"
              onClick={() => handleSort("date")}
            >
              תאריך
              {sortField === "date" && (sortDirection === "asc" ? " ↑" : " ↓")}
            </th>
            <th>סוג קופה</th>
            <th>שם קופה</th>
            <th>מספר קופה</th>
            <th
              className="sortable-header sortable-header-right"
              onClick={() => handleSort("amount")}
            >
              סכום
              {sortField === "amount" && (sortDirection === "asc" ? " ↑" : " ↓")}
            </th>
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

            const sortedSnapshots = [...monthSnapshots];

            if (sortField === "date") {
              sortedSnapshots.sort((a, b) => {
                const aDate = a.snapshotDate || "";
                const bDate = b.snapshotDate || "";
                if (aDate === bDate) {
                  return 0;
                }
                const comparison = aDate < bDate ? -1 : 1;
                return sortDirection === "asc" ? comparison : -comparison;
              });
            } else if (sortField === "amount") {
              sortedSnapshots.sort((a, b) => {
                const aAmount =
                  typeof a.amount === "number" && !Number.isNaN(a.amount)
                    ? a.amount
                    : 0;
                const bAmount =
                  typeof b.amount === "number" && !Number.isNaN(b.amount)
                    ? b.amount
                    : 0;
                const diff = aAmount - bAmount;
                if (diff === 0) {
                  return 0;
                }
                return sortDirection === "asc" ? diff : -diff;
              });
            }

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
                {sortedSnapshots.map((snapshot) => (
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
