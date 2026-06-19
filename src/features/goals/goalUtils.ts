import type { Goal } from "./goalTypes";

export function sortGoalsByDueDate(goals: Goal[]) {
  return [...goals].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function isGoalDueSoon(goal: Goal, now = Date.now()) {
  const hours = (new Date(goal.dueDate).getTime() - now) / 36e5;
  return goal.status === "active" && hours >= 0 && hours <= 24;
}
