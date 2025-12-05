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
  const [expandedSnapshotIds, setExpandedSnapshotIds] = useState<number[]>([]);

  const toggleSnapshotExpansion = (snapshotId: number) => {
    setExpandedSnapshotIds((current) =>
      current.includes(snapshotId)
        ? current.filter((id) => id !== snapshotId)
        : [...current, snapshotId]
    );
  };

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
        <div className="empty-state-text">
          אפשר גם לנסות להקטין או לנקות את הפילטרים מעל הטבלה (סוג קופה, חיפוש, סכום
          מינימלי).
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="accounts-table">
        <thead>
          <tr>
            <th>שם קופה</th>
            <th
              className={`sortable-header sortable-header-right${
                sortField === "amount" ? " sortable-header-active" : ""
              }`}
              onClick={() => handleSort("amount")}
            >
              סכום
              {sortField === "amount" && (sortDirection === "asc" ? " ↑" : " ↓")}
            </th>
            <th className="accounts-table-expand-header" />
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
                  <td className="accounts-month-label" colSpan={2}>
                    {monthKey === "unknown"
                      ? "ללא חודש"
                      : formatMonthLabel(monthKey)}
                  </td>
                  <td className="accounts-month-total">
                    {formatCurrency(monthTotal)}
                  </td>
                </tr>
                {sortedSnapshots.map((snapshot) => {
                  const isExpanded = expandedSnapshotIds.includes(snapshot.id);
                  const rowKey = `${monthKey}-${snapshot.id}`;

                  return (
                    <>
                      <tr
                        key={rowKey}
                        className={`accounts-row accounts-row-collapsible${
                          isExpanded ? " accounts-row-expanded" : ""
                        }`}
                        onClick={() => toggleSnapshotExpansion(snapshot.id)}
                      >
                        <td
                          className="accounts-cell-main"
                          data-label="שם קופה"
                        >
                          <div className="accounts-cell-title">
                            {snapshot.fundName || ""}
                          </div>
                        </td>
                        <td
                          className="accounts-cell-amount"
                          data-label="סכום"
                        >
                          {formatCurrency(snapshot.amount)}
                        </td>
                        <td
                          className="accounts-cell-expand"
                          data-label="פרטים"
                        >
                          {isExpanded ? "פחות פרטים" : "עוד פרטים"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${rowKey}-details`}
                          className="accounts-row-details"
                        >
                          <td colSpan={3}>
                            <div className="account-details">
                              <div className="account-details-item">
                                <span className="account-details-label">תאריך:</span>
                                <span className="account-details-value">
                                  {formatDate(snapshot.snapshotDate)}
                                </span>
                              </div>
                              <div className="account-details-item">
                                <span className="account-details-label">סוג קופה:</span>
                                <span className="account-details-value">
                                  {snapshot.fundType || ""}
                                </span>
                              </div>
                              <div className="account-details-item">
                                <span className="account-details-label">מספר קופה:</span>
                                <span className="account-details-value">
                                  {snapshot.fundNumber || ""}
                                </span>
                              </div>
                              <div className="account-details-item">
                                <span className="account-details-label">קוד קופה:</span>
                                <span className="account-details-value">
                                  {snapshot.fundCode || ""}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AccountsTable;
