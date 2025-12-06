import { useMemo, useState } from "react";
import { Snapshot } from "../models/snapshot";
import { formatCurrency, formatDate, formatMonthLabel } from "../utils/formatters";

interface AccountsTableProps {
  snapshots: Snapshot[];
}

type SortField = "date" | "amount" | null;
type SortDirection = "asc" | "desc";

interface CanonicalFund {
  fundCode: string;
  displayFundCode: string;
  canonicalName: string;
  totalAmount: number;
  fundType: string;
  fundNumber: string;
  snapshotDate: string;
  allNames: { name: string; amount: number }[];
  snapshotIds: number[];
}

function AccountsTable({ snapshots }: AccountsTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedFundCodes, setExpandedFundCodes] = useState<string[]>([]);

  const toggleFundCodeExpansion = (fundCode: string) => {
    setExpandedFundCodes((current) =>
      current.includes(fundCode)
        ? current.filter((code) => code !== fundCode)
        : [...current, fundCode]
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

  const canonicalizeFunds = (monthSnapshots: Snapshot[]): CanonicalFund[] => {
    const byFundCode: Record<string, Snapshot[]> = {};

    const extractCoreFundCode = (fullCode: string): string => {
      const match = fullCode.match(/\((\d+)\)/);
      if (match) {
        return match[1];
      }
      return fullCode.trim() || "unknown";
    };

    monthSnapshots.forEach((snapshot) => {
      const rawCode = snapshot.fundCode || "unknown";
      const coreCode = extractCoreFundCode(rawCode);
      if (!byFundCode[coreCode]) {
        byFundCode[coreCode] = [];
      }
      byFundCode[coreCode].push(snapshot);
    });

    const canonicalFunds: CanonicalFund[] = [];

    Object.entries(byFundCode).forEach(([fundCode, fundSnapshots]) => {
      const totalAmount = fundSnapshots.reduce((sum, s) => {
        const val = typeof s.amount === "number" && !Number.isNaN(s.amount) ? s.amount : 0;
        return sum + val;
      }, 0);

      const sortedByAmount = [...fundSnapshots].sort((a, b) => {
        const aAmt = typeof a.amount === "number" && !Number.isNaN(a.amount) ? a.amount : 0;
        const bAmt = typeof b.amount === "number" && !Number.isNaN(b.amount) ? b.amount : 0;
        return bAmt - aAmt;
      });

      const topSnapshot = sortedByAmount[0];
      const canonicalName = topSnapshot?.fundName || "";

      const nameAmountMap: Record<string, number> = {};
      fundSnapshots.forEach((s) => {
        const name = s.fundName || "";
        const amt = typeof s.amount === "number" && !Number.isNaN(s.amount) ? s.amount : 0;
        if (!nameAmountMap[name]) {
          nameAmountMap[name] = 0;
        }
        nameAmountMap[name] += amt;
      });

      const allNames = Object.entries(nameAmountMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      canonicalFunds.push({
        fundCode,
        displayFundCode: topSnapshot?.fundCode || "",
        canonicalName,
        totalAmount,
        fundType: topSnapshot?.fundType || "",
        fundNumber: topSnapshot?.fundNumber || "",
        snapshotDate: topSnapshot?.snapshotDate || "",
        allNames,
        snapshotIds: fundSnapshots.map((s) => s.id),
      });
    });

    return canonicalFunds;
  };

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
            const canonicalFunds = canonicalizeFunds(monthSnapshots);

            const monthTotal = canonicalFunds.reduce((sum, fund) => sum + fund.totalAmount, 0);

            const sortedFunds = [...canonicalFunds];

            if (sortField === "date") {
              sortedFunds.sort((a, b) => {
                const aDate = a.snapshotDate || "";
                const bDate = b.snapshotDate || "";
                if (aDate === bDate) {
                  return 0;
                }
                const comparison = aDate < bDate ? -1 : 1;
                return sortDirection === "asc" ? comparison : -comparison;
              });
            } else if (sortField === "amount") {
              sortedFunds.sort((a, b) => {
                const diff = a.totalAmount - b.totalAmount;
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
                {sortedFunds.map((fund) => {
                  const rowKey = `${monthKey}-${fund.fundCode}`;
                  const isExpanded = expandedFundCodes.includes(fund.fundCode);
                  const hasMultipleNames = fund.allNames.length > 1;

                  return (
                    <>
                      <tr
                        key={rowKey}
                        className={`accounts-row accounts-row-collapsible${
                          isExpanded ? " accounts-row-expanded" : ""
                        }`}
                        onClick={() => toggleFundCodeExpansion(fund.fundCode)}
                      >
                        <td
                          className="accounts-cell-main"
                          data-label="שם קופה"
                        >
                          <div className="accounts-cell-title">
                            {fund.canonicalName}
                            {hasMultipleNames && (
                              <span className="accounts-cell-badge">
                                +{fund.allNames.length - 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className="accounts-cell-amount"
                          data-label="סכום"
                        >
                          {formatCurrency(fund.totalAmount)}
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
                                  {formatDate(fund.snapshotDate)}
                                </span>
                              </div>
                              <div className="account-details-item">
                                <span className="account-details-label">סוג קופה:</span>
                                <span className="account-details-value">
                                  {fund.fundType}
                                </span>
                              </div>
                              <div className="account-details-item">
                                <span className="account-details-label">מספר קופה:</span>
                                <span className="account-details-value">
                                  {fund.fundNumber}
                                </span>
                              </div>
                              <div className="account-details-item">
                                <span className="account-details-label">קוד קופה:</span>
                                <span className="account-details-value">
                                  {fund.fundCode}
                                </span>
                              </div>
                            </div>
                            {hasMultipleNames && (
                              <div className="account-names-list">
                                <div className="account-names-title">
                                  כל שמות הקופות לקוד זה:
                                </div>
                                <ul className="account-names-items">
                                  {fund.allNames.map((nameEntry, idx) => (
                                    <li key={idx} className="account-names-item">
                                      <span className="account-names-name">
                                        {nameEntry.name || "(ללא שם)"}
                                      </span>
                                      <span className="account-names-amount">
                                        {formatCurrency(nameEntry.amount)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
