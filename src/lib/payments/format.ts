const DEFAULT_USD_TO_VND_RATE = 26000;

function getUsdToVndRate() {
  const configuredRate = Number.parseFloat(process.env.NEXT_PUBLIC_USD_TO_VND_RATE ?? "");

  if (Number.isFinite(configuredRate) && configuredRate > 0) {
    return configuredRate;
  }

  return DEFAULT_USD_TO_VND_RATE;
}

export function toDisplayVndAmount(amount: number, currency?: string | null) {
  const normalizedCurrency = (currency ?? "VND").toUpperCase();
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (normalizedCurrency === "USD") {
    return Math.round(safeAmount * getUsdToVndRate());
  }

  return Math.round(safeAmount);
}

export function formatMoneyVnd(amount: number, currency?: string | null) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(toDisplayVndAmount(amount, currency));
}

export function getDisplayCurrencyLabel(currency?: string | null) {
  void currency;
  return "VND";
}
