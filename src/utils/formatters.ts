const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | null | undefined): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "";
  }
  return currencyFormatter.format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("he-IL");
}

export function formatMonthLabel(month: string | null | undefined): string {
  if (!month) {
    return "";
  }

  // Expected format: YYYY-MM
  if (month.length === 7 && month.includes("-")) {
    const [year, mm] = month.split("-");
    return `${mm}/${year.slice(-2)}`;
  }

  return month;
}
