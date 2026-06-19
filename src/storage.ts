import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type { FinanceEntry, FinanceKind, Goal, GoalCategory, GoalStatus, NoteItem } from "./types";

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

type FinanceEntryRow = {
  id: string;
  title: string;
  amount: number;
  kind: FinanceKind;
  category: string;
  memo: string;
  entry_date: string;
  created_at?: string;
  updated_at?: string;
};

type IdeaNoteRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at?: string;
};

type StudyNoteRow = {
  id: string;
  theme_id: string;
  title: string;
  answers: Record<string, string>;
  created_at: string;
  updated_at?: string;
};

type PasteNoteRow = {
  id: string;
  title: string;
  body_html: string;
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

function financeEntryToRow(entry: FinanceEntry): FinanceEntryRow {
  return {
    id: entry.id,
    title: entry.title,
    amount: entry.amount,
    kind: entry.kind,
    category: entry.category || "other",
    memo: entry.memo,
    entry_date: new Date(entry.date).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function rowToFinanceEntry(row: FinanceEntryRow): FinanceEntry {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    kind: row.kind,
    category: row.category || "other",
    date: row.entry_date,
    memo: row.memo ?? "",
  };
}

function rowToIdeaNote(row: IdeaNoteRow): NoteItem {
  return {
    id: row.id,
    kind: "idea",
    title: row.title,
    body: row.body ?? "",
    createdAt: row.created_at,
  };
}

function rowToStudyNote(row: StudyNoteRow): NoteItem {
  return {
    id: row.id,
    kind: "study",
    themeId: row.theme_id || "tool",
    title: row.title,
    body: "",
    answers: row.answers ?? {},
    createdAt: row.created_at,
  };
}

function rowToPasteNote(row: PasteNoteRow): NoteItem {
  return {
    id: row.id,
    kind: "paste",
    title: row.title,
    body: row.body_html ?? "",
    createdAt: row.created_at,
  };
}

function noteUpdatedAt() {
  return new Date().toISOString();
}

function noteCreatedAt(note: NoteItem) {
  const createdAt = new Date(note.createdAt || Date.now());
  return Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString();
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

export async function loadRemoteFinanceEntries(): Promise<FinanceEntry[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("finance_entries")
    .select("id,title,amount,kind,category,memo,entry_date,created_at,updated_at")
    .order("entry_date", { ascending: false });

  if (error) {
    console.warn("Supabase finance load failed. Falling back to localStorage.", error.message);
    return null;
  }

  return (data as FinanceEntryRow[]).map(rowToFinanceEntry);
}

export async function saveRemoteFinanceEntries(entries: FinanceEntry[]) {
  if (!isSupabaseConfigured || !supabase) return false;
  if (!entries.length) return true;

  const rows = entries.map(financeEntryToRow);
  const { error } = await supabase.from("finance_entries").upsert(rows, { onConflict: "id" });
  if (error) {
    console.warn("Supabase finance save failed. Data remains saved locally.", error.message);
    return false;
  }

  return true;
}

export async function deleteRemoteFinanceEntry(id: string) {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase.from("finance_entries").delete().eq("id", id);
  if (error) {
    console.warn("Supabase finance delete failed. Data remains saved locally.", error.message);
    return false;
  }

  return true;
}

export async function loadRemoteNotes(): Promise<NoteItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const [ideaResult, studyResult, pasteResult] = await Promise.all([
    supabase.from("idea_notes").select("id,title,body,created_at,updated_at"),
    supabase.from("study_notes").select("id,theme_id,title,answers,created_at,updated_at"),
    supabase.from("paste_notes").select("id,title,body_html,created_at,updated_at"),
  ]);

  const error = ideaResult.error ?? studyResult.error ?? pasteResult.error;
  if (error) {
    console.warn("Supabase notes load failed. Falling back to localStorage.", error.message);
    return null;
  }

  return [
    ...((ideaResult.data ?? []) as IdeaNoteRow[]).map(rowToIdeaNote),
    ...((studyResult.data ?? []) as StudyNoteRow[]).map(rowToStudyNote),
    ...((pasteResult.data ?? []) as PasteNoteRow[]).map(rowToPasteNote),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveRemoteNotes(notes: NoteItem[]) {
  if (!isSupabaseConfigured || !supabase) return false;
  if (!notes.length) return true;

  const updated_at = noteUpdatedAt();
  const ideaRows = notes
    .filter((note) => (note.kind ?? "idea") === "idea")
    .map((note) => ({
      id: note.id,
      title: note.title,
      body: note.body ?? "",
      created_at: noteCreatedAt(note),
      updated_at,
    }));
  const studyRows = notes
    .filter((note) => note.kind === "study")
    .map((note) => ({
      id: note.id,
      theme_id: note.themeId || "tool",
      title: note.title,
      answers: note.answers ?? {},
      created_at: noteCreatedAt(note),
      updated_at,
    }));
  const pasteRows = notes
    .filter((note) => note.kind === "paste")
    .map((note) => ({
      id: note.id,
      title: note.title,
      body_html: note.body ?? "",
      created_at: noteCreatedAt(note),
      updated_at,
    }));

  const results = await Promise.all([
    ideaRows.length ? supabase.from("idea_notes").upsert(ideaRows, { onConflict: "id" }) : Promise.resolve({ error: null }),
    studyRows.length ? supabase.from("study_notes").upsert(studyRows, { onConflict: "id" }) : Promise.resolve({ error: null }),
    pasteRows.length ? supabase.from("paste_notes").upsert(pasteRows, { onConflict: "id" }) : Promise.resolve({ error: null }),
  ]);

  const error = results.find((result) => result.error)?.error;
  if (error) {
    console.warn("Supabase notes save failed. Data remains saved locally.", error.message);
    return false;
  }

  return true;
}

export async function deleteRemoteNote(note: NoteItem) {
  if (!isSupabaseConfigured || !supabase) return false;

  const tableName =
    note.kind === "study" ? "study_notes" : note.kind === "paste" ? "paste_notes" : "idea_notes";
  const { error } = await supabase.from(tableName).delete().eq("id", note.id);

  if (error) {
    console.warn("Supabase note delete failed. Data remains saved locally.", error.message);
    return false;
  }

  return true;
}
