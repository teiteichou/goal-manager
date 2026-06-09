import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type { Goal } from "./types";

const storeKey = "rinaspace-goals-v1";
const focusStoreKey = "rinaspace-focus-minutes";

export function loadLocalGoals(fallback: Goal[]): Goal[] {
  const stored = localStorage.getItem(storeKey);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as Goal[];
  } catch {
    return fallback;
  }
}

export function saveLocalGoals(goals: Goal[]) {
  localStorage.setItem(storeKey, JSON.stringify(goals));
}

export function loadFocusMinutes() {
  return Number(localStorage.getItem(focusStoreKey) || 0);
}

export function saveFocusMinutes(minutes: number) {
  localStorage.setItem(focusStoreKey, String(minutes));
}

export async function loadRemoteGoals(): Promise<Goal[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("goals")
    .select("payload")
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Supabase load failed. Falling back to localStorage.", error.message);
    return null;
  }

  return data.map((row) => row.payload as Goal);
}

export async function saveRemoteGoals(goals: Goal[]) {
  if (!isSupabaseConfigured || !supabase) return;

  const rows = goals.map((goal) => ({
    id: goal.id,
    payload: goal,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("goals").upsert(rows);
  if (error) {
    console.warn("Supabase save failed. Data remains saved locally.", error.message);
  }
}
