import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type { Goal, GoalCategory, GoalStatus } from "./types";

const storeKey = "rinaspace-goals-v1";
const focusStoreKey = "rinaspace-focus-minutes";
const focusDailyStoreKey = "rinaspace-focus-daily-v1";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeGoalIds(goals: Goal[]) {
  let changed = false;
  const seen = new Set<string>();

  const normalized = goals.map((goal) => {
    const isReusableId = uuidPattern.test(goal.id) && !seen.has(goal.id);
    const id = isReusableId ? goal.id : crypto.randomUUID();

    seen.add(id);
    if (id !== goal.id) changed = true;
    return id === goal.id ? goal : { ...goal, id };
  });

  return { goals: normalized, changed };
}

type GoalRow = {
  id: string;
  title: string;
  category: GoalCategory;
  due_date: string;
  notes: string;
  reward: string;
  reminder_preset_minutes: number;
  status: GoalStatus;
  progress: number;
  reviews: Goal["reviews"];
  created_at: string;
  updated_at?: string;
};

function goalToRow(goal: Goal): GoalRow {
  return {
    id: goal.id,
    title: goal.title,
    category: goal.category,
    due_date: new Date(goal.dueDate).toISOString(),
    notes: goal.notes,
    reward: goal.reward,
    reminder_preset_minutes: goal.reminderPreset,
    status: goal.status,
    progress: goal.progress,
    reviews: goal.reviews,
    created_at: new Date(goal.createdAt).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    dueDate: toLocalInputValue(new Date(row.due_date)),
    notes: row.notes,
    reward: row.reward,
    reminderPreset: row.reminder_preset_minutes,
    status: row.status,
    progress: row.progress,
    createdAt: row.created_at,
    reviews: row.reviews ?? [],
  };
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function loadLocalGoals(fallback: Goal[]): Goal[] {
  const stored = localStorage.getItem(storeKey);
  if (!stored) return fallback;
  try {
    const { goals, changed } = normalizeGoalIds(JSON.parse(stored) as Goal[]);
    if (changed) saveLocalGoals(goals);
    return goals;
  } catch {
    return fallback;
  }
}

export function saveLocalGoals(goals: Goal[]) {
  localStorage.setItem(storeKey, JSON.stringify(goals));
}

export function loadFocusStats(todayKey: string) {
  const stored = localStorage.getItem(focusDailyStoreKey);
  if (stored) {
    try {
      return JSON.parse(stored) as Record<string, number>;
    } catch {
      return {};
    }
  }

  const legacyMinutes = Number(localStorage.getItem(focusStoreKey) || 0);
  const migrated = legacyMinutes > 0 ? { [todayKey]: legacyMinutes } : {};
  saveFocusStats(migrated);
  return migrated;
}

export function saveFocusStats(stats: Record<string, number>) {
  localStorage.setItem(focusDailyStoreKey, JSON.stringify(stats));
}

export async function loadRemoteGoals(): Promise<Goal[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("goals")
    .select("id,title,category,due_date,notes,reward,reminder_preset_minutes,status,progress,reviews,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Supabase load failed. Falling back to localStorage.", error.message);
    return null;
  }

  return normalizeGoalIds((data as GoalRow[]).map(rowToGoal)).goals;
}

export async function saveRemoteGoals(goals: Goal[]) {
  if (!isSupabaseConfigured || !supabase) return false;

  const rows = normalizeGoalIds(goals).goals.map(goalToRow);

  const { error } = await supabase.from("goals").upsert(rows, { onConflict: "id" });
  if (error) {
    console.warn("Supabase save failed. Data remains saved locally.", error.message);
    return false;
  }

  return true;
}

export async function deleteRemoteGoal(id: string) {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) {
    console.warn("Supabase delete failed. Data remains saved locally.", error.message);
    return false;
  }

  return true;
}
