export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatScore(value: number) {
  return Math.round(value).toString();
}

export function formatDecimal(value: number, digits = 2) {
  return value.toFixed(digits);
}
