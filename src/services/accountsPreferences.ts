const ACCOUNTS_PREFERENCES_KEY = "bz_clientapp_accounts_preferences";

export interface AccountsPreferences {
  selectedMonthKey?: string | null;
  fundTypeFilter?: string;
  searchText?: string;
  minAmountFilter?: string;
}

export function getAccountsPreferences(): AccountsPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ACCOUNTS_PREFERENCES_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AccountsPreferences | null;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      selectedMonthKey:
        typeof parsed.selectedMonthKey === "string" ? parsed.selectedMonthKey : null,
      fundTypeFilter:
        typeof parsed.fundTypeFilter === "string" ? parsed.fundTypeFilter : undefined,
      searchText:
        typeof parsed.searchText === "string" ? parsed.searchText : undefined,
      minAmountFilter:
        typeof parsed.minAmountFilter === "string" ? parsed.minAmountFilter : undefined,
    };
  } catch {
    return null;
  }
}

export function setAccountsPreferences(preferences: AccountsPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const cleaned: AccountsPreferences = {
      selectedMonthKey:
        typeof preferences.selectedMonthKey === "string"
          ? preferences.selectedMonthKey
          : null,
      fundTypeFilter: preferences.fundTypeFilter ?? undefined,
      searchText: preferences.searchText ?? undefined,
      minAmountFilter: preferences.minAmountFilter ?? undefined,
    };

    window.localStorage.setItem(
      ACCOUNTS_PREFERENCES_KEY,
      JSON.stringify(cleaned)
    );
  } catch {
    return;
  }
}
