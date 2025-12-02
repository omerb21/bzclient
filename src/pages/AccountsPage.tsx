import { useEffect, useMemo, useState } from "react";
import { fetchClientSnapshots, fetchClientHistory } from "../services/crmService";
import { Snapshot } from "../models/snapshot";
import { HistoryPoint } from "../models/historyPoint";
import { hasClientTokenConfigured } from "../config/clientConfig";
import AccountsTable from "../components/AccountsTable";
import AccountsSummary from "../components/AccountsSummary";
import MonthlyHistoryChart from "../components/MonthlyHistoryChart";

function AccountsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  const hasClientToken = hasClientTokenConfigured();

  useEffect(() => {
    async function load() {
      // Debug: trace loading flow
      console.log("[ClientApp] AccountsPage load start", { hasClientToken });

      if (!hasClientToken) {
        setError("לא הוגדר token ללקוח באפליקציה. פנה למנהל המערכת.");
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
        setError("אירעה שגיאה בטעינת נתוני הקופות.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hasClientToken]);

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

  const totalAmount = filteredSnapshots.reduce((sum, snapshot) => {
    const value =
      typeof snapshot.amount === "number" && !Number.isNaN(snapshot.amount)
        ? snapshot.amount
        : 0;
    return sum + value;
  }, 0);

  const currentMonthIndex = selectedMonthKey
    ? monthKeys.indexOf(selectedMonthKey)
    : -1;
  const canGoPrevMonth = currentMonthIndex >= 0 && currentMonthIndex < monthKeys.length - 1;
  const canGoNextMonth = currentMonthIndex > 0;

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

  return (
    <div className="page-container">
      <h1 className="page-title">נתוני קופות</h1>
      {loading && <p className="page-message">טוען נתונים...</p>}
      {error && !loading && (
        <p className="page-message page-message-error">{error}</p>
      )}
      {!loading && !error && hasClientToken && (
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
          <AccountsSummary totalAmount={totalAmount} />
          <AccountsTable snapshots={filteredSnapshots} />
          <MonthlyHistoryChart points={historyPoints} />
        </>
      )}
    </div>
  );
}

export default AccountsPage;
