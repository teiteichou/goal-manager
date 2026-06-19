import type { FinanceEntry } from "./financeTypes";

export function sumFinanceEntries(entries: FinanceEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}
