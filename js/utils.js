/** Kleine, wiederverwendbare Hilfsfunktionen. */
export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function formatCurrency(value, locale = "de-DE", currency = "EUR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    value,
  );
}

export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}
