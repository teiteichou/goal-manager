export type GoalCategory = "long" | "middle" | "day" | "hour" | "minute";
export type GoalStatus = "active" | "done" | "missed";
export type ExtendReason = "scope" | "priority" | "health" | "resource";
export type SoundType = "off" | "library" | "forest" | "exam" | "field" | "classroom" | "rain";
export type FinanceKind = "income" | "expense";
export type NoteKind = "idea" | "study" | "paste";
export type CodeLanguage = "java" | "oracle" | "react" | "javascript";

export type GoalReview = {
  comment: string;
  reason: ExtendReason;
  date: string;
};

export type Goal = {
  id: string;
  title: string;
  category: GoalCategory;
  dueDate: string;
  notes: string;
  reward: string;
  reminderPreset: number;
  status: GoalStatus;
  progress: number;
  createdAt: string;
  reviews: GoalReview[];
};

export type GoalFormValues = Pick<
  Goal,
  "id" | "title" | "category" | "dueDate" | "notes" | "reward" | "reminderPreset"
>;

export type FinanceEntry = {
  id: string;
  title: string;
  amount: number;
  kind: FinanceKind;
  category: string;
  date: string;
  memo: string;
};

export type NoteItem = {
  id: string;
  kind?: NoteKind;
  themeId?: string;
  title: string;
  body: string;
  answers?: Record<string, string>;
  createdAt: string;
};

export type CodeSnippet = {
  id: string;
  title: string;
  language: CodeLanguage;
  code: string;
  notes: string;
  result: string;
  createdAt?: string;
  updatedAt: string;
};
