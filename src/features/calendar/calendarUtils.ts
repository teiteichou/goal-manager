import { monthKey, toDateKey } from "../../shared/utils/date";

export function buildMonthDays(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstVisible = new Date(year, month, 1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisible);
    date.setDate(firstVisible.getDate() + index);
    return date;
  });
}

export function isSameDateKey(date: Date, dateKey: string) {
  return toDateKey(date) === dateKey;
}

export { monthKey, toDateKey };
