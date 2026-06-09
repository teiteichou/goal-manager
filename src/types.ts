export type GoalCategory = "long" | "middle" | "day" | "hour" | "minute";
export type GoalStatus = "active" | "done" | "missed";
export type ExtendReason = "scope" | "priority" | "health" | "resource";
export type SoundType = "off" | "library" | "forest" | "exam" | "field" | "classroom" | "rain";

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
