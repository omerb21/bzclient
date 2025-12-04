import type React from "react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchClientSnapshots, fetchClientHistory } from "../services/crmService";
import { Snapshot } from "../models/snapshot";
import { HistoryPoint } from "../models/historyPoint";
import { hasClientTokenConfigured } from "../config/clientConfig";
import { getStoredPin, setStoredPin, clearStoredPin } from "../services/pinStorage";
import AccountsTable from "../components/AccountsTable";
import AccountsSummary from "../components/AccountsSummary";
import MonthlyHistoryChart from "../components/MonthlyHistoryChart";
import { formatCurrency, formatDate } from "../utils/formatters";

function AccountsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [pin, setPin] = useState<string>(() => getStoredPin() || "");
  const [hasValidPin, setHasValidPin] = useState<boolean>(() => !!getStoredPin());
  const [pinError, setPinError] = useState<string | null>(null);
  const [fundTypeFilter, setFundTypeFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  const [minAmountFilter, setMinAmountFilter] = useState<string>("");

  const hasClientToken = hasClientTokenConfigured();

  const summaryTrendText = useMemo(() => {
    if (!selectedMonthKey || historyPoints.length < 2) {
      return null;
    }

    const monthToAmount: Record<string, number> = {};
    historyPoints.forEach((point) => {
      const value =
        typeof point.amount === "number" && Number.isFinite(point.amount)
          ? point.amount
          : 0;
      monthToAmount[point.month] = value;
    });

    const historyMonthKeys = Object.keys(monthToAmount).sort();
    const currentIndex = historyMonthKeys.indexOf(selectedMonthKey);

    if (currentIndex <= 0) {
      return null;
    }

    const currentAmount = monthToAmount[historyMonthKeys[currentIndex]] ?? 0;
    const prevAmount = monthToAmount[historyMonthKeys[currentIndex - 1]] ?? 0;

    if (!Number.isFinite(currentAmount) || !Number.isFinite(prevAmount)) {
      return null;
    }

    const diff = currentAmount - prevAmount;

    if (diff === 0) {
      return "ללא שינוי ביחס לחודש הקודם.";
    }

    if (prevAmount <= 0) {
      return null;
    }

    const percent = Math.abs((diff / prevAmount) * 100);
    const roundedPercent = Math.round(percent * 10) / 10;

    if (!Number.isFinite(roundedPercent) || roundedPercent === 0) {
      return null;
    }

    if (diff > 0) {
      return `עלייה של ${roundedPercent}% ביחס לחודש הקודם.`;
    }

    return `ירידה של ${roundedPercent}% ביחס לחודש הקודם.`;
  }, [historyPoints, selectedMonthKey]);

  useEffect(() => {
    async function load() {
      // Debug: trace loading flow
      console.log("[ClientApp] AccountsPage load start", { hasClientToken });

      if (!hasClientToken) {
        setError("לא הוגדר token ללקוח באפליקציה. פנה למנהל המערכת.");
        setLoading(false);
        return;
      }

      if (!hasValidPin) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("[ClientApp] Fetching CRM data using client token header");
        const [snapshotsData, historyData] = await Promise.all([
          fetchClientSnapshots(),
          fetchClientHistory(),
        ]);
        console.log("[ClientApp] CRM data loaded", {
          snapshotsCount: snapshotsData.length,
          historyPointsCount: historyData.length,
        });
        setSnapshots(snapshotsData);
        setHistoryPoints(historyData);
      } catch (err) {
        console.error("[ClientApp] Error loading CRM data", err);
        if (axios.isAxiosError(err) && err.response && err.response.status === 401) {
          clearStoredPin();
          setPin("");
          setHasValidPin(false);
          setPinError("קוד גישה שגוי. נסה שוב.");
          setError(null);
        } else {
          setError("אירעה שגיאה בטעינת נתוני הקופות.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hasClientToken, hasValidPin]);

  const monthKeys = useMemo(() => {
    const months = new Set<string>();
    snapshots.forEach((snapshot) => {
      const raw = snapshot.snapshotDate || "";
      if (raw.length >= 7) {
        months.add(raw.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [snapshots]);

  useEffect(() => {
    if (!monthKeys.length) {
      setSelectedMonthKey(null);
      return;
    }

    setSelectedMonthKey((prev) => {
      if (prev && monthKeys.includes(prev)) {
        return prev;
      }
      return monthKeys[0];
    });
  }, [monthKeys]);

  const filteredSnapshots = useMemo(() => {
    if (!selectedMonthKey) {
      return snapshots;
    }
    return snapshots.filter((snapshot) => {
      const raw = snapshot.snapshotDate || "";
      return raw.slice(0, 7) === selectedMonthKey;
    });
  }, [snapshots, selectedMonthKey]);

  const fundTypes = useMemo(() => {
    const types = new Set<string>();
    snapshots.forEach((snapshot) => {
      const type = snapshot.fundType || "";
      if (type.trim()) {
        types.add(type);
      }
    });
    return Array.from(types).sort();
  }, [snapshots]);

  const visibleSnapshots = useMemo(() => {
    let result = filteredSnapshots;

    if (fundTypeFilter !== "all") {
      const target = fundTypeFilter.toLowerCase();
      result = result.filter((snapshot) =>
        (snapshot.fundType || "").toLowerCase() === target
      );
    }

    const trimmedSearch = searchText.trim();
    if (trimmedSearch) {
      const query = trimmedSearch.toLowerCase();
      result = result.filter((snapshot) => {
        const name = (snapshot.fundName || "").toLowerCase();
        const number = (snapshot.fundNumber || "").toLowerCase();
        const code = (snapshot.fundCode || "").toLowerCase();
        return (
          name.includes(query) || number.includes(query) || code.includes(query)
        );
      });
    }

    const trimmedMin = minAmountFilter.trim();
    if (trimmedMin) {
      const min = Number(trimmedMin.replace(/,/g, ""));
      if (!Number.isNaN(min) && min > 0) {
        result = result.filter((snapshot) => {
          const value =
            typeof snapshot.amount === "number" && !Number.isNaN(snapshot.amount)
              ? snapshot.amount
              : 0;
          return value >= min;
        });
      }
    }

    return result;
  }, [filteredSnapshots, fundTypeFilter, searchText, minAmountFilter]);

  const totalAmount = visibleSnapshots.reduce((sum, snapshot) => {
    const value =
      typeof snapshot.amount === "number" && !Number.isNaN(snapshot.amount)
        ? snapshot.amount
        : 0;
    return sum + value;
  }, 0);

  const fundCount = visibleSnapshots.length;
  const averageAmount = fundCount > 0 ? totalAmount / fundCount : 0;

  const currentMonthIndex = selectedMonthKey
    ? monthKeys.indexOf(selectedMonthKey)
    : -1;
  const canGoPrevMonth = currentMonthIndex >= 0 && currentMonthIndex < monthKeys.length - 1;
  const canGoNextMonth = currentMonthIndex > 0;

  const handlePinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPin(event.target.value);
    if (pinError) {
      setPinError(null);
    }
  };

  const handlePinSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = pin.trim();

    if (!value) {
      setPinError("יש להזין קוד גישה.");
      return;
    }

    if (!/^\d{6}$/.test(value)) {
      setPinError("קוד הגישה צריך להיות בן 6 ספרות.");
      return;
    }

    setStoredPin(value);
    setHasValidPin(true);
    setPinError(null);
    setError(null);
  };

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) {
      return;
    }
    const nextKey = monthKeys[currentMonthIndex + 1];
    if (nextKey) {
      setSelectedMonthKey(nextKey);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) {
      return;
    }
    const nextKey = monthKeys[currentMonthIndex - 1];
    if (nextKey) {
      setSelectedMonthKey(nextKey);
    }
  };

  const handleExportVisible = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!visibleSnapshots.length) {
      return;
    }

    const rows: string[][] = [];
    rows.push(["תאריך", "סוג קופה", "שם קופה", "מספר קופה", "סכום"]);

    visibleSnapshots.forEach((snapshot) => {
      rows.push([
        formatDate(snapshot.snapshotDate),
        snapshot.fundType || "",
        snapshot.fundName || "",
        snapshot.fundNumber || "",
        formatCurrency(snapshot.amount),
      ]);
    });

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const safe = cell.replace(/"/g, '""');
            return `"${safe}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const monthPart = selectedMonthKey ? `-${selectedMonthKey}` : "";
    link.download = `funds${monthPart}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">נתוני קופות</h1>
      <p className="page-subtitle">
        סקירה מרוכזת של כל הקופות כפי שהן מופיעות במערכת BEN-ZVI.
      </p>
      {loading && !error && (
        <p className="page-message">טוען נתונים...</p>
      )}
      {error && !loading && (
        <p className="page-message page-message-error">{error}</p>
      )}
      {loading && !error && hasClientToken && hasValidPin && (
        <div className="page-loading">
          <div className="skeleton skeleton-summary" />
          <div className="skeleton skeleton-table-row" />
          <div className="skeleton skeleton-table-row" />
          <div className="skeleton skeleton-chart" />
        </div>
      )}
      {!loading && !error && hasClientToken && !hasValidPin && (
        <form className="pin-form" onSubmit={handlePinSubmit}>
          <label className="pin-form-label" htmlFor="pin-input">
            הקלד קוד גישה (6 ספרות)
          </label>
          <input
            id="pin-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="pin-form-input"
            value={pin}
            onChange={handlePinChange}
            autoComplete="one-time-code"
          />
          {pinError && <p className="pin-form-error">{pinError}</p>}
          <div className="pin-form-actions">
            <button type="submit" className="button-primary">
              אישור
            </button>
          </div>
        </form>
      )}
      {!loading && !error && hasClientToken && hasValidPin && (
        <>
          {monthKeys.length > 0 && selectedMonthKey && (
            <div className="accounts-month-selector">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={!canGoPrevMonth}
              >
                חודש קודם
              </button>
              <span className="accounts-month-current">
                {selectedMonthKey}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={!canGoNextMonth}
              >
                חודש הבא
              </button>
            </div>
          )}
          <div className="accounts-filters">
            <div className="filter-group">
              <label className="filter-label" htmlFor="fund-type-filter">
                סוג קופה
              </label>
              <select
                id="fund-type-filter"
                className="filter-select"
                value={fundTypeFilter}
                onChange={(event) => setFundTypeFilter(event.target.value)}
              >
                <option value="all">כל הסוגים</option>
                {fundTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="search-filter">
                חיפוש לפי שם / מספר
              </label>
              <input
                id="search-filter"
                className="filter-input"
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="לדוגמה: שם קופה או מספר"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="min-amount-filter">
                סכום מינימלי
              </label>
              <input
                id="min-amount-filter"
                className="filter-input"
                type="number"
                min={0}
                value={minAmountFilter}
                onChange={(event) => setMinAmountFilter(event.target.value)}
              />
            </div>
            <div className="filters-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={handleExportVisible}
                disabled={!visibleSnapshots.length}
              >
                יצוא ל-CSV
              </button>
            </div>
          </div>
          <AccountsSummary
            totalAmount={totalAmount}
            fundCount={fundCount}
            averageAmount={averageAmount}
            trendText={summaryTrendText}
          />
          <AccountsTable snapshots={visibleSnapshots} />
          <MonthlyHistoryChart points={historyPoints} />
        </>
      )}
    </div>
  );
}

export default AccountsPage;
