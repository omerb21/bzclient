import type React from "react";
import { useState } from "react";
import {
  resetClientCredentials,
  updateClientToken,
  updateClientPin,
} from "../services/adminClientAccess";

function ClientAccessAdminPage() {
  const [clientIdText, setClientIdText] = useState<string>("");
  const [lastClientId, setLastClientId] = useState<number | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState<string>("");
  const [manualPin, setManualPin] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const parseClientId = (): number | null => {
    const trimmed = clientIdText.trim();
    if (!trimmed) {
      return null;
    }
    const value = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return value;
  };

  const handleResetCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const clientId = parseClientId();
    if (!clientId) {
      setErrorMessage("יש להזין מספר לקוח תקין.");
      return;
    }

    try {
      setLoading(true);
      const result = await resetClientCredentials(clientId);
      setLastClientId(result.clientId);
      setGeneratedToken(result.clientToken);
      setGeneratedPin(result.clientPin);
      setManualToken(result.clientToken);
      setManualPin(result.clientPin);
      setStatusMessage("נוצרו טוקן וקוד גישה חדשים ללקוח.");
    } catch (error) {
      setErrorMessage("אירעה שגיאה בעת יצירת טוקן/ססמה. בדוק את מספר הלקוח.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateToken = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const clientId = parseClientId();
    if (!clientId) {
      setErrorMessage("יש להזין מספר לקוח תקין.");
      return;
    }

    const value = manualToken.trim();
    if (!value) {
      setErrorMessage("טוקן לא יכול להיות ריק.");
      return;
    }

    try {
      setLoading(true);
      await updateClientToken(clientId, value);
      setLastClientId(clientId);
      setGeneratedToken(value);
      setStatusMessage("הטוקן עודכן בהצלחה.");
    } catch (error) {
      setErrorMessage("אירעה שגיאה בעת עדכון הטוקן.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePin = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const clientId = parseClientId();
    if (!clientId) {
      setErrorMessage("יש להזין מספר לקוח תקין.");
      return;
    }

    const trimmed = manualPin.trim();
    if (!trimmed) {
      setErrorMessage("יש להזין קוד גישה או להשתמש באיפוס מלא.");
      return;
    }

    if (!/^\d{6}$/.test(trimmed)) {
      setErrorMessage("קוד הגישה צריך להיות בן 6 ספרות.");
      return;
    }

    try {
      setLoading(true);
      await updateClientPin(clientId, trimmed);
      setLastClientId(clientId);
      setGeneratedPin(trimmed);
      setStatusMessage("קוד הגישה עודכן בהצלחה.");
    } catch (error) {
      setErrorMessage("אירעה שגיאה בעת עדכון קוד הגישה.");
    } finally {
      setLoading(false);
    }
  };

  const currentClientUrl =
    lastClientId && generatedToken
      ? `https://bzclient.onrender.com/?token=${generatedToken}`
      : null;

  return (
    <div className="page-container">
      <h1 className="page-title">ניהול גישה לאפליקציית לקוח</h1>

      {loading && <p className="page-message">מבצע פעולה...</p>}

      {errorMessage && !loading && (
        <p className="page-message page-message-error">{errorMessage}</p>
      )}

      {statusMessage && !loading && !errorMessage && (
        <p className="page-message">{statusMessage}</p>
      )}

      <form className="admin-form" onSubmit={handleResetCredentials}>
        <h2 className="admin-form-title">יצירת טוקן וקוד גישה חדשים</h2>
        <label className="admin-form-label" htmlFor="client-id-input">
          מספר לקוח (כפי שמופיע במערכת BEN-ZVI)
        </label>
        <input
          id="client-id-input"
          type="number"
          min={1}
          className="admin-form-input"
          value={clientIdText}
          onChange={(event) => setClientIdText(event.target.value)}
        />
        <button type="submit" className="button-primary" disabled={loading}>
          צור token + PIN חדשים
        </button>
      </form>

      <form className="admin-form" onSubmit={handleUpdateToken}>
        <h2 className="admin-form-title">עדכון טוקן ידני</h2>
        <label className="admin-form-label" htmlFor="manual-token-input">
          טוקן חדש ללקוח
        </label>
        <input
          id="manual-token-input"
          type="text"
          className="admin-form-input"
          value={manualToken}
          onChange={(event) => setManualToken(event.target.value)}
        />
        <button type="submit" className="button-secondary" disabled={loading}>
          עדכן טוקן
        </button>
      </form>

      <form className="admin-form" onSubmit={handleUpdatePin}>
        <h2 className="admin-form-title">עדכון קוד גישה (PIN)</h2>
        <label className="admin-form-label" htmlFor="manual-pin-input">
          קוד גישה חדש (6 ספרות)
        </label>
        <input
          id="manual-pin-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          className="admin-form-input"
          value={manualPin}
          onChange={(event) => setManualPin(event.target.value)}
        />
        <button type="submit" className="button-secondary" disabled={loading}>
          עדכן קוד גישה
        </button>
      </form>

      {lastClientId && (generatedToken || generatedPin) && (
        <div className="admin-result">
          <h2 className="admin-form-title">פרטי גישה שנוצרו</h2>
          <p>מספר לקוח: {lastClientId}</p>
          {generatedToken && <p>Token: {generatedToken}</p>}
          {generatedPin && <p>PIN: {generatedPin}</p>}
          {currentClientUrl && (
            <p>
              כתובת ללקוח: <span className="admin-result-url">{currentClientUrl}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientAccessAdminPage;
