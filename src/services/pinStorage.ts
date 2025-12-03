const PIN_STORAGE_KEY = "bz_clientapp_pin";

export function getStoredPin(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(PIN_STORAGE_KEY);
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function setStoredPin(pin: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const value = pin.trim();
  if (!value) {
    return;
  }

  try {
    window.localStorage.setItem(PIN_STORAGE_KEY, value);
  } catch {
    return;
  }
}

export function clearStoredPin(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(PIN_STORAGE_KEY);
  } catch {
    return;
  }
}
