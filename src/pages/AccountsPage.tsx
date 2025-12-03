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

function AccountsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [pin, setPin] = useState<string>(() => getStoredPin() || "");
  const [hasValidPin, setHasValidPin] = useState<boolean>(() => !!getStoredPin());
  const [pinError, setPinError] = useState<string | null>(null);

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

  return (
    <div className="page-container">
      <h1 className="page-title">נתוני קופות</h1>
      {loading && <p className="page-message">טוען נתונים...</p>}
      {error && !loading && (
        <p className="page-message page-message-error">{error}</p>
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
          <AccountsSummary totalAmount={totalAmount} />
          <AccountsTable snapshots={filteredSnapshots} />
          <MonthlyHistoryChart points={historyPoints} />
        </>
      )}
    </div>
  );
}

export default AccountsPage;
