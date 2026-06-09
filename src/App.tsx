import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  Copy,
  Edit3,
  Languages,
  LayoutDashboard,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  StickyNote,
  Target,
  Timer,
  Wallet,
  X,
} from "lucide-react";
import {
  loadFocusMinutes,
  loadLocalGoals,
  loadRemoteGoals,
  saveFocusMinutes,
  saveLocalGoals,
  saveRemoteGoals,
} from "./storage";
import { isSupabaseConfigured } from "./supabaseClient";
import type { ExtendReason, Goal, GoalCategory, GoalFormValues, GoalStatus, SoundType } from "./types";

type Language = "ja" | "en" | "zh";
type ViewKey = "dashboard" | "goals" | "calendar" | "notes" | "finance";
type FinanceKind = "income" | "expense";

type NoteItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type FinanceEntry = {
  id: string;
  title: string;
  amount: number;
  kind: FinanceKind;
  date: string;
  memo: string;
};

type Texts = {
  languageName: string;
  nav: Record<ViewKey, string>;
  category: Record<GoalCategory, string>;
  reason: Record<ExtendReason, string>;
  sound: Record<SoundType, string>;
  status: Record<GoalStatus, string>;
  brandSub: string;
  all: string;
  focusTimer: string;
  shortFocus: string;
  shorterFive: string;
  longerFive: string;
  start: string;
  stop: string;
  backgroundSound: string;
  pageEyebrow: string;
  headline: string;
  syncWaiting: string;
  syncLocal: string;
  syncDone: string;
  allowNotifications: string;
  createGoal: string;
  active: string;
  done: string;
  soon: string;
  todayFocus: string;
  goalList: string;
  completed: string;
  missed: string;
  emptyGoals: string;
  aiCoach: string;
  suggest: string;
  reminders: string;
  noReminders: string;
  remaining: (hours: number, progress: number) => string;
  coachEmpty: string;
  coachShort: string;
  coachNormal: string;
  rewardSentence: (reward: string) => string;
  editGoal: string;
  close: string;
  title: string;
  titlePlaceholder: string;
  goalCategory: string;
  dueDate: string;
  notesField: string;
  notesPlaceholder: string;
  reward: string;
  rewardPlaceholder: string;
  reminderTiming: string;
  reminderOptions: Record<number, string>;
  cancel: string;
  save: string;
  missedReview: string;
  comment: string;
  commentPlaceholder: string;
  extendReason: string;
  newDueDate: string;
  copyAsNew: string;
  extend: string;
  nearDue: string;
  previousReason: string;
  progress: string;
  copy: string;
  edit: string;
  review: string;
  rewardPrefix: string;
  copySuffix: string;
  retrySuffix: string;
  duePassedTitle: string;
  duePassedBody: (title: string) => string;
  completedTitle: string;
  completedBody: (title: string) => string;
  focusDoneTitle: string;
  focusDoneBody: string;
  dashboardTitle: string;
  nextDeadlines: string;
  noUpcoming: string;
  calendarTitle: string;
  calendarEmpty: string;
  notesTitle: string;
  noteTitlePlaceholder: string;
  noteBodyPlaceholder: string;
  addNote: string;
  emptyNotes: string;
  financeTitle: string;
  financeNamePlaceholder: string;
  amount: string;
  income: string;
  expense: string;
  memo: string;
  addEntry: string;
  balance: string;
  totalIncome: string;
  totalExpense: string;
  emptyFinance: string;
  sampleGoalOne: { title: string; notes: string; reward: string };
  sampleGoalTwo: { title: string; notes: string; reward: string };
};

const translations: Record<Language, Texts> = {
  ja: {
    languageName: "日本語",
    nav: {
      dashboard: "Dashboard",
      goals: "Goals",
      calendar: "Calendar",
      notes: "Notes",
      finance: "Finance",
    },
    category: {
      long: "長期目標",
      middle: "中期目標",
      day: "D目標",
      hour: "H目標",
      minute: "Min目標",
    },
    reason: {
      scope: "見積もりより範囲が広かった",
      priority: "優先順位が変わった",
      health: "体調・生活リズムの影響",
      resource: "資料や環境が不足した",
    },
    sound: {
      off: "なし",
      library: "図書館",
      forest: "森林",
      exam: "試験会場",
      field: "運動場",
      classroom: "教室",
      rain: "雨の日",
    },
    status: { active: "進行中", done: "達成済み", missed: "未達成" },
    brandSub: "目標・記録・お金",
    all: "すべて",
    focusTimer: "Focus Timer",
    shortFocus: "短時間集中",
    shorterFive: "5分短くする",
    longerFive: "5分長くする",
    start: "開始",
    stop: "停止",
    backgroundSound: "背景音",
    pageEyebrow: "RinaSpace",
    headline: "目標、予定、メモ、家計をひとつの場所で整える。",
    syncWaiting: "Supabase 接続待機中",
    syncLocal: "ローカル保存",
    syncDone: "Supabase 同期済み",
    allowNotifications: "通知を許可",
    createGoal: "目標を作成",
    active: "進行中",
    done: "達成",
    soon: "期限間近",
    todayFocus: "今日の集中",
    goalList: "目標リスト",
    completed: "達成済み",
    missed: "未達成",
    emptyGoals: "この条件の目標はまだありません。",
    aiCoach: "AIコーチ",
    suggest: "提案",
    reminders: "リマインダー",
    noReminders: "予定されている通知はありません。",
    remaining: (hours, progress) => `残り約 ${hours} 時間。進捗は ${progress}% です。`,
    coachEmpty: "目標を作成すると、次の一手を整理します。",
    coachShort: "今すぐタイマーを開始し、完了条件を一つに絞りましょう。",
    coachNormal: "期限から逆算して、今日終わらせる最小タスクを一つだけ決めましょう。",
    rewardSentence: (reward) => `達成後のご褒美は「${reward}」。`,
    editGoal: "目標を編集",
    close: "閉じる",
    title: "タイトル",
    titlePlaceholder: "例：日本語能力試験 N1 に合格する",
    goalCategory: "カテゴリ",
    dueDate: "期限",
    notesField: "実行メモ",
    notesPlaceholder: "成功条件、勉強範囲、準備物など",
    reward: "達成時のご褒美",
    rewardPlaceholder: "例：投資予算から本を買う",
    reminderTiming: "通知タイミング",
    reminderOptions: { 0: "期限ちょうど", 10: "10分前", 60: "1時間前", 1440: "1日前" },
    cancel: "キャンセル",
    save: "保存",
    missedReview: "未達成レビュー",
    comment: "コメント",
    commentPlaceholder: "何が詰まりましたか。次は何を変えますか。",
    extendReason: "延長理由",
    newDueDate: "新しい期限",
    copyAsNew: "コピーして新規化",
    extend: "延長する",
    nearDue: "期限間近",
    previousReason: "前回理由",
    progress: "進捗",
    copy: "コピー",
    edit: "編集",
    review: "レビュー",
    rewardPrefix: "ご褒美",
    copySuffix: "（コピー）",
    retrySuffix: "（再挑戦）",
    duePassedTitle: "期限を過ぎました",
    duePassedBody: (title) => `${title} のレビューを書きましょう。`,
    completedTitle: "目標達成",
    completedBody: (title) => `${title} を達成しました。ご褒美を受け取りましょう。`,
    focusDoneTitle: "集中完了",
    focusDoneBody: "短時間目標のセッションが完了しました。",
    dashboardTitle: "ホーム",
    nextDeadlines: "次の期限",
    noUpcoming: "直近の期限はありません。",
    calendarTitle: "日程",
    calendarEmpty: "カレンダーに表示する目標はありません。",
    notesTitle: "ノート",
    noteTitlePlaceholder: "ノートのタイトル",
    noteBodyPlaceholder: "考え、学び、復盤を書き留める",
    addNote: "ノートを追加",
    emptyNotes: "ノートはまだありません。",
    financeTitle: "記帳",
    financeNamePlaceholder: "例：参考書、給料、カフェ",
    amount: "金額",
    income: "収入",
    expense: "支出",
    memo: "メモ",
    addEntry: "記録する",
    balance: "残高",
    totalIncome: "収入合計",
    totalExpense: "支出合計",
    emptyFinance: "記帳データはまだありません。",
    sampleGoalOne: {
      title: "JLPT N1 の語彙を 300 語復習する",
      notes: "間違えた単語は例文つきで復習する。",
      reward: "新しい参考書を一冊買う",
    },
    sampleGoalTwo: {
      title: "毎朝 25 分の集中学習を 7 日続ける",
      notes: "短時間タイマーと雨の日の背景音を使う。",
      reward: "週末にお気に入りのカフェへ行く",
    },
  },
  en: {
    languageName: "English",
    nav: {
      dashboard: "Dashboard",
      goals: "Goals",
      calendar: "Calendar",
      notes: "Notes",
      finance: "Finance",
    },
    category: {
      long: "Long-term",
      middle: "Mid-term",
      day: "D Goal",
      hour: "H Goal",
      minute: "Min Goal",
    },
    reason: {
      scope: "The scope was larger than estimated",
      priority: "Priorities changed",
      health: "Health or daily rhythm got in the way",
      resource: "Materials or environment were missing",
    },
    sound: {
      off: "Off",
      library: "Library",
      forest: "Forest",
      exam: "Exam room",
      field: "Sports field",
      classroom: "Classroom",
      rain: "Rainy day",
    },
    status: { active: "Active", done: "Done", missed: "Missed" },
    brandSub: "Goals, notes, finance",
    all: "All",
    focusTimer: "Focus Timer",
    shortFocus: "Short focus",
    shorterFive: "Reduce by 5 minutes",
    longerFive: "Add 5 minutes",
    start: "Start",
    stop: "Stop",
    backgroundSound: "Background sound",
    pageEyebrow: "RinaSpace",
    headline: "Organize goals, schedule, notes, and money in one place.",
    syncWaiting: "Supabase pending",
    syncLocal: "Local storage",
    syncDone: "Supabase synced",
    allowNotifications: "Allow notifications",
    createGoal: "Create goal",
    active: "Active",
    done: "Done",
    soon: "Due soon",
    todayFocus: "Focus today",
    goalList: "Goal list",
    completed: "Completed",
    missed: "Missed",
    emptyGoals: "No goals match this view yet.",
    aiCoach: "AI Coach",
    suggest: "Suggest",
    reminders: "Reminders",
    noReminders: "No reminders scheduled.",
    remaining: (hours, progress) => `About ${hours} hours left. Progress is ${progress}%.`,
    coachEmpty: "Create a goal and I will organize the next step.",
    coachShort: "Start the timer now and narrow the finish condition to one thing.",
    coachNormal: "Work backward from the deadline and choose one smallest task for today.",
    rewardSentence: (reward) => `Your reward after completion is "${reward}".`,
    editGoal: "Edit goal",
    close: "Close",
    title: "Title",
    titlePlaceholder: "Example: Pass JLPT N1",
    goalCategory: "Category",
    dueDate: "Due date",
    notesField: "Action notes",
    notesPlaceholder: "Success criteria, study range, materials, etc.",
    reward: "Completion reward",
    rewardPlaceholder: "Example: Buy a book from my learning budget",
    reminderTiming: "Reminder timing",
    reminderOptions: { 0: "At deadline", 10: "10 minutes before", 60: "1 hour before", 1440: "1 day before" },
    cancel: "Cancel",
    save: "Save",
    missedReview: "Missed goal review",
    comment: "Comment",
    commentPlaceholder: "What got stuck? What will you change next time?",
    extendReason: "Extension reason",
    newDueDate: "New due date",
    copyAsNew: "Copy as new",
    extend: "Extend",
    nearDue: "Due soon",
    previousReason: "Previous reason",
    progress: "Progress",
    copy: "Copy",
    edit: "Edit",
    review: "Review",
    rewardPrefix: "Reward",
    copySuffix: " (copy)",
    retrySuffix: " (retry)",
    duePassedTitle: "Deadline passed",
    duePassedBody: (title) => `Write a review for ${title}.`,
    completedTitle: "Goal completed",
    completedBody: (title) => `${title} is complete. Time to claim your reward.`,
    focusDoneTitle: "Focus complete",
    focusDoneBody: "Your short focus session is complete.",
    dashboardTitle: "Home",
    nextDeadlines: "Next deadlines",
    noUpcoming: "No upcoming deadlines.",
    calendarTitle: "Schedule",
    calendarEmpty: "No goals to show on the calendar.",
    notesTitle: "Notes",
    noteTitlePlaceholder: "Note title",
    noteBodyPlaceholder: "Capture thoughts, learnings, and reviews",
    addNote: "Add note",
    emptyNotes: "No notes yet.",
    financeTitle: "Finance",
    financeNamePlaceholder: "Example: textbook, salary, cafe",
    amount: "Amount",
    income: "Income",
    expense: "Expense",
    memo: "Memo",
    addEntry: "Add entry",
    balance: "Balance",
    totalIncome: "Total income",
    totalExpense: "Total expense",
    emptyFinance: "No finance entries yet.",
    sampleGoalOne: {
      title: "Review 300 JLPT N1 vocabulary words",
      notes: "Review missed words with example sentences.",
      reward: "Buy a new reference book",
    },
    sampleGoalTwo: {
      title: "Do 25 minutes of focused study every morning for 7 days",
      notes: "Use the short timer and rainy-day background sound.",
      reward: "Go to a favorite cafe on the weekend",
    },
  },
  zh: {
    languageName: "中文",
    nav: {
      dashboard: "首页",
      goals: "目标管理",
      calendar: "日历",
      notes: "笔记",
      finance: "记账",
    },
    category: {
      long: "长期目标",
      middle: "中期目标",
      day: "D目标",
      hour: "H目标",
      minute: "Min目标",
    },
    reason: {
      scope: "范围比预估更大",
      priority: "优先级发生变化",
      health: "身体或生活节奏影响",
      resource: "资料或环境不足",
    },
    sound: {
      off: "无",
      library: "图书馆",
      forest: "森林",
      exam: "考场",
      field: "操场",
      classroom: "教室",
      rain: "雨天",
    },
    status: { active: "进行中", done: "已完成", missed: "未达成" },
    brandSub: "目标、笔记、记账",
    all: "全部",
    focusTimer: "专注计时",
    shortFocus: "短时专注",
    shorterFive: "缩短 5 分钟",
    longerFive: "增加 5 分钟",
    start: "开始",
    stop: "停止",
    backgroundSound: "背景音",
    pageEyebrow: "RinaSpace",
    headline: "把目标、日程、笔记和账本整理在一个地方。",
    syncWaiting: "Supabase 等待连接",
    syncLocal: "本地保存",
    syncDone: "Supabase 已同步",
    allowNotifications: "允许通知",
    createGoal: "创建目标",
    active: "进行中",
    done: "达成",
    soon: "临近期限",
    todayFocus: "今日专注",
    goalList: "目标列表",
    completed: "已达成",
    missed: "未达成",
    emptyGoals: "当前条件下还没有目标。",
    aiCoach: "AI教练",
    suggest: "建议",
    reminders: "提醒",
    noReminders: "暂无计划提醒。",
    remaining: (hours, progress) => `剩余约 ${hours} 小时。进度为 ${progress}%。`,
    coachEmpty: "创建目标后，我会帮你整理下一步。",
    coachShort: "现在启动计时器，并把完成条件缩小到一件事。",
    coachNormal: "从期限倒推，只选择今天要完成的最小任务。",
    rewardSentence: (reward) => `达成后的奖励是“${reward}”。`,
    editGoal: "编辑目标",
    close: "关闭",
    title: "标题",
    titlePlaceholder: "例：通过日语能力考试 N1",
    goalCategory: "分类",
    dueDate: "期限",
    notesField: "执行备注",
    notesPlaceholder: "成功条件、学习范围、准备物等",
    reward: "达成奖励",
    rewardPlaceholder: "例：用学习预算买一本书",
    reminderTiming: "提醒时间",
    reminderOptions: { 0: "到期时", 10: "提前10分钟", 60: "提前1小时", 1440: "提前1天" },
    cancel: "取消",
    save: "保存",
    missedReview: "未达成复盘",
    comment: "总结",
    commentPlaceholder: "卡在哪里？下次要改变什么？",
    extendReason: "延期理由",
    newDueDate: "新的期限",
    copyAsNew: "复制为新目标",
    extend: "延期",
    nearDue: "临近期限",
    previousReason: "上次理由",
    progress: "进度",
    copy: "复制",
    edit: "编辑",
    review: "复盘",
    rewardPrefix: "奖励",
    copySuffix: "（复制）",
    retrySuffix: "（再挑战）",
    duePassedTitle: "已超过期限",
    duePassedBody: (title) => `请为「${title}」写复盘。`,
    completedTitle: "目标达成",
    completedBody: (title) => `「${title}」已达成。领取你的奖励吧。`,
    focusDoneTitle: "专注完成",
    focusDoneBody: "短时目标计时已完成。",
    dashboardTitle: "首页",
    nextDeadlines: "最近期限",
    noUpcoming: "暂无近期期限。",
    calendarTitle: "日程",
    calendarEmpty: "日历中暂无目标。",
    notesTitle: "笔记",
    noteTitlePlaceholder: "笔记标题",
    noteBodyPlaceholder: "记录想法、学习内容和复盘",
    addNote: "添加笔记",
    emptyNotes: "还没有笔记。",
    financeTitle: "记账",
    financeNamePlaceholder: "例：参考书、工资、咖啡",
    amount: "金额",
    income: "收入",
    expense: "支出",
    memo: "备注",
    addEntry: "记一笔",
    balance: "余额",
    totalIncome: "总收入",
    totalExpense: "总支出",
    emptyFinance: "还没有记账数据。",
    sampleGoalOne: {
      title: "复习 300 个 JLPT N1 词汇",
      notes: "把错过的单词配例句复习。",
      reward: "买一本新的参考书",
    },
    sampleGoalTwo: {
      title: "连续 7 天每天早上专注学习 25 分钟",
      notes: "使用短时计时器和雨天背景音。",
      reward: "周末去喜欢的咖啡店",
    },
  },
};

const languageOrder: Language[] = ["ja", "en", "zh"];
const languageStoreKey = "rinaspace-language";
const notesStoreKey = "rinaspace-notes-v1";
const financeStoreKey = "rinaspace-finance-v1";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function hoursUntil(dateValue: string) {
  return (new Date(dateValue).getTime() - Date.now()) / 36e5;
}

function formatDate(date: Date, language: Language) {
  const locale = language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(amount: number, language: Language) {
  const locale = language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(amount);
}

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(languageStoreKey);
  return languageOrder.includes(stored as Language) ? (stored as Language) : "ja";
}

function readJson<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function buildInitialGoals(seed: Texts): Goal[] {
  return [
    {
      id: crypto.randomUUID(),
      title: seed.sampleGoalOne.title,
      category: "day",
      dueDate: toLocalInputValue(addMinutes(new Date(), 60 * 22)),
      notes: seed.sampleGoalOne.notes,
      reward: seed.sampleGoalOne.reward,
      reminderPreset: 60,
      status: "active",
      progress: 35,
      createdAt: new Date().toISOString(),
      reviews: [],
    },
    {
      id: crypto.randomUUID(),
      title: seed.sampleGoalTwo.title,
      category: "middle",
      dueDate: toLocalInputValue(addMinutes(new Date(), 60 * 24 * 7)),
      notes: seed.sampleGoalTwo.notes,
      reward: seed.sampleGoalTwo.reward,
      reminderPreset: 1440,
      status: "active",
      progress: 15,
      createdAt: new Date().toISOString(),
      reviews: [],
    },
  ];
}

const emptyGoalForm = (): GoalFormValues => ({
  id: "",
  title: "",
  category: "day",
  dueDate: toLocalInputValue(addMinutes(new Date(), 60)),
  notes: "",
  reward: "",
  reminderPreset: 10,
});

export default function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const t = translations[language];
  const [currentView, setCurrentView] = useState<ViewKey>("dashboard");
  const [goals, setGoals] = useState<Goal[]>(() => loadLocalGoals(buildInitialGoals(translations.ja)));
  const [notes, setNotes] = useState<NoteItem[]>(() => readJson(notesStoreKey, []));
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(() => readJson(financeStoreKey, []));
  const [filter, setFilter] = useState<GoalCategory | "all">("all");
  const [view, setView] = useState<GoalStatus>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormValues>(() => emptyGoalForm());
  const [isGoalDialogOpen, setGoalDialogOpen] = useState(false);
  const [reviewGoalId, setReviewGoalId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [extendReason, setExtendReason] = useState<ExtendReason>("scope");
  const [extendedDate, setExtendedDate] = useState(toLocalInputValue(addMinutes(new Date(), 60 * 24)));
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(loadFocusMinutes);
  const [soundType, setSoundType] = useState<SoundType>("off");
  const [syncStatus, setSyncStatus] = useState<"waiting" | "local" | "synced">(
    isSupabaseConfigured ? "waiting" : "local",
  );
  const [noteDraft, setNoteDraft] = useState({ title: "", body: "" });
  const [financeDraft, setFinanceDraft] = useState({
    title: "",
    amount: "",
    kind: "expense" as FinanceKind,
    memo: "",
  });
  const audioRef = useRef<{ context: AudioContext; oscillators: OscillatorNode[] } | null>(null);

  useEffect(() => {
    localStorage.setItem(languageStoreKey, language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);

  useEffect(() => {
    let alive = true;

    loadRemoteGoals().then((remoteGoals) => {
      if (!alive || !remoteGoals?.length) return;
      setGoals(remoteGoals);
      saveLocalGoals(remoteGoals);
      setSyncStatus("synced");
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    let changed = false;
    const nextGoals = goals.map((goal) => {
      if (goal.status === "active" && new Date(goal.dueDate).getTime() < now) {
        changed = true;
        notify(t.duePassedTitle, t.duePassedBody(goal.title));
        return { ...goal, status: "missed" as GoalStatus };
      }
      return goal;
    });

    if (changed) {
      setGoals(nextGoals);
      return;
    }

    saveLocalGoals(goals);
    saveRemoteGoals(goals);
  }, [goals, t]);

  useEffect(() => {
    localStorage.setItem(notesStoreKey, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(financeStoreKey, JSON.stringify(financeEntries));
  }, [financeEntries]);

  useEffect(() => {
    if (!timerRunning) return undefined;

    const handle = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(handle);
          setTimerRunning(false);
          stopSound();
          playPing();
          notify(t.focusDoneTitle, t.focusDoneBody);
          setFocusMinutes((minutes) => {
            const next = minutes + Math.round(timerTotal / 60);
            saveFocusMinutes(next);
            return next;
          });
          return timerTotal;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(handle);
  }, [timerRunning, timerTotal, t]);

  useEffect(() => {
    if (timerRunning) {
      startSound(soundType);
    } else {
      stopSound();
    }

    return stopSound;
  }, [soundType, timerRunning]);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const doneGoals = goals.filter((goal) => goal.status === "done");
  const soonGoals = activeGoals.filter((goal) => {
    const hours = hoursUntil(goal.dueDate);
    return hours >= 0 && hours <= 24;
  });
  const selectedGoal = goals.find((goal) => goal.id === selectedId) ?? activeGoals[0] ?? null;
  const filteredGoals = goals
    .filter((goal) => (filter === "all" ? true : goal.category === filter))
    .filter((goal) => goal.status === view);
  const reminders = activeGoals
    .map((goal) => ({ goal, reminderAt: addMinutes(new Date(goal.dueDate), -goal.reminderPreset) }))
    .filter((item) => item.reminderAt >= new Date())
    .sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime())
    .slice(0, 5);
  const upcomingGoals = [...activeGoals].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 6);
  const incomeTotal = financeEntries.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expenseTotal = financeEntries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const syncLabel = syncStatus === "synced" ? t.syncDone : syncStatus === "waiting" ? t.syncWaiting : t.syncLocal;
  const timerDisplay = `${Math.floor(timerSeconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(timerSeconds % 60)
    .toString()
    .padStart(2, "0")}`;

  function updateGoalForm<K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) {
    setGoalForm((current) => ({ ...current, [key]: value }));
  }

  function openGoalDialog(goal?: Goal) {
    setGoalForm(
      goal
        ? {
            id: goal.id,
            title: goal.title,
            category: goal.category,
            dueDate: goal.dueDate,
            notes: goal.notes,
            reward: goal.reward,
            reminderPreset: goal.reminderPreset,
          }
        : emptyGoalForm(),
    );
    setGoalDialogOpen(true);
  }

  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const existing = goals.find((goal) => goal.id === goalForm.id);
    const nextGoal: Goal = {
      ...goalForm,
      id: goalForm.id || crypto.randomUUID(),
      title: goalForm.title.trim(),
      notes: goalForm.notes.trim(),
      reward: goalForm.reward.trim(),
      status: existing?.status ?? "active",
      progress: existing?.progress ?? 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      reviews: existing?.reviews ?? [],
    };

    setGoals((current) =>
      existing ? current.map((goal) => (goal.id === existing.id ? nextGoal : goal)) : [nextGoal, ...current],
    );
    setSelectedId(nextGoal.id);
    setGoalDialogOpen(false);
    setCurrentView("goals");
  }

  function markDone(goal: Goal) {
    setGoals((current) =>
      current.map((item) => (item.id === goal.id ? { ...item, status: "done", progress: 100 } : item)),
    );
    playPing();
    notify(t.completedTitle, t.completedBody(goal.title));
  }

  function addProgress(goal: Goal) {
    setGoals((current) =>
      current.map((item) => (item.id === goal.id ? { ...item, progress: Math.min(100, item.progress + 25) } : item)),
    );
  }

  function copyGoal(goal: Goal, titleSuffix = t.copySuffix) {
    const next: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      title: `${goal.title}${titleSuffix}`,
      status: "active",
      progress: 0,
      createdAt: new Date().toISOString(),
      reviews: [],
    };
    setGoals((current) => [next, ...current]);
    setSelectedId(next.id);
  }

  function openReview(goal: Goal) {
    setReviewGoalId(goal.id);
    setReviewComment("");
    setExtendReason("scope");
    setExtendedDate(toLocalInputValue(addMinutes(new Date(goal.dueDate), 60 * 24)));
  }

  function finalizeReview(mode: "extend" | "copy") {
    const goal = goals.find((item) => item.id === reviewGoalId);
    if (!goal) return;

    const review = {
      comment: reviewComment.trim(),
      reason: extendReason,
      date: new Date().toISOString(),
    };

    if (mode === "copy") {
      const next: Goal = {
        ...goal,
        id: crypto.randomUUID(),
        title: `${goal.title}${t.retrySuffix}`,
        dueDate: extendedDate,
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString(),
        reviews: [review],
      };
      setGoals((current) => [next, ...current]);
      setSelectedId(next.id);
    } else {
      setGoals((current) =>
        current.map((item) =>
          item.id === goal.id
            ? {
                ...item,
                dueDate: extendedDate,
                status: "active",
                reviews: [...item.reviews, review],
              }
            : item,
        ),
      );
    }

    setReviewGoalId(null);
  }

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    finalizeReview("extend");
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteDraft.title.trim() && !noteDraft.body.trim()) return;
    setNotes((current) => [
      {
        id: crypto.randomUUID(),
        title: noteDraft.title.trim() || t.notesTitle,
        body: noteDraft.body.trim(),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setNoteDraft({ title: "", body: "" });
  }

  function addFinanceEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(financeDraft.amount);
    if (!financeDraft.title.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setFinanceEntries((current) => [
      {
        id: crypto.randomUUID(),
        title: financeDraft.title.trim(),
        amount,
        kind: financeDraft.kind,
        memo: financeDraft.memo.trim(),
        date: new Date().toISOString(),
      },
      ...current,
    ]);
    setFinanceDraft({ title: "", amount: "", kind: "expense", memo: "" });
  }

  function adjustTimer(minutes: number) {
    if (timerRunning) return;
    const next = Math.max(5 * 60, Math.min(120 * 60, timerTotal + minutes * 60));
    setTimerTotal(next);
    setTimerSeconds(next);
  }

  function toggleTimer() {
    setTimerRunning((running) => !running);
  }

  function requestNotifications() {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }

  function notify(title: string, body: string) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  function playPing() {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  }

  function startSound(type: SoundType) {
    stopSound();
    if (type === "off") return;

    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = 0.035;
    gain.connect(context.destination);

    const oscillators = soundFrequencies(type).map((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = type === "rain" ? "sawtooth" : "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start();
      return oscillator;
    });

    audioRef.current = { context, oscillators };
  }

  function stopSound() {
    if (!audioRef.current) return;
    audioRef.current.oscillators.forEach((oscillator) => oscillator.stop());
    audioRef.current.context.close();
    audioRef.current = null;
  }

  function coachText() {
    if (!selectedGoal) return t.coachEmpty;

    const remainingHours = Math.max(0, Math.round(hoursUntil(selectedGoal.dueDate)));
    const nextStep =
      selectedGoal.category === "minute" || selectedGoal.category === "hour" ? t.coachShort : t.coachNormal;

    return `${t.remaining(remainingHours, selectedGoal.progress)} ${nextStep}`;
  }

  const navItems: Array<{ key: ViewKey; icon: typeof LayoutDashboard }> = [
    { key: "dashboard", icon: LayoutDashboard },
    { key: "goals", icon: Target },
    { key: "calendar", icon: CalendarDays },
    { key: "notes", icon: StickyNote },
    { key: "finance", icon: Wallet },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">R</span>
          <div>
            <strong>RinaSpace</strong>
            <span>{t.brandSub}</span>
          </div>
        </div>

        <nav className="module-nav" aria-label="RinaSpace">
          {navItems.map(({ key, icon: Icon }) => (
            <button
              className={`module-nav-item ${currentView === key ? "active" : ""}`}
              key={key}
              onClick={() => setCurrentView(key)}
            >
              <Icon size={17} />
              {t.nav[key]}
            </button>
          ))}
        </nav>

        <section className="focus-panel">
          <div>
            <span className="eyebrow">{t.focusTimer}</span>
            <h2>{t.shortFocus}</h2>
          </div>
          <div className="timer-ring">
            <span>{timerDisplay}</span>
          </div>
          <div className="timer-controls">
            <button className="icon-btn" onClick={() => adjustTimer(-5)} title={t.shorterFive}>
              <Minus size={17} />
            </button>
            <button className="primary small" onClick={toggleTimer}>
              <Timer size={16} />
              {timerRunning ? t.stop : t.start}
            </button>
            <button className="icon-btn" onClick={() => adjustTimer(5)} title={t.longerFive}>
              <Plus size={17} />
            </button>
          </div>
          <label className="field compact">
            <span>{t.backgroundSound}</span>
            <select value={soundType} onChange={(event) => setSoundType(event.target.value as SoundType)}>
              {Object.entries(t.sound).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">{t.pageEyebrow}</span>
            <h1>{t.headline}</h1>
          </div>
          <div className="top-actions">
            <div className="language-switch" aria-label="Language switch">
              <Languages size={16} />
              {languageOrder.map((item) => (
                <button
                  className={language === item ? "active" : ""}
                  key={item}
                  onClick={() => setLanguage(item)}
                  title={translations[item].languageName}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="sync-pill">{syncLabel}</span>
            <button className="ghost" onClick={requestNotifications}>
              <Bell size={16} />
              {t.allowNotifications}
            </button>
            <button className="primary" onClick={() => openGoalDialog()}>
              <Plus size={17} />
              {t.createGoal}
            </button>
          </div>
        </header>

        <section className="stats-grid" aria-label={t.dashboardTitle}>
          <Stat label={t.active} value={activeGoals.length} />
          <Stat label={t.done} value={doneGoals.length} />
          <Stat label={t.soon} value={soonGoals.length} />
          <Stat label={t.todayFocus} value={`${focusMinutes}m`} />
        </section>

        {currentView === "dashboard" ? (
          <DashboardView
            balance={incomeTotal - expenseTotal}
            expenseTotal={expenseTotal}
            formatMoney={(amount) => formatMoney(amount, language)}
            incomeTotal={incomeTotal}
            notes={notes}
            openGoalDialog={openGoalDialog}
            setCurrentView={setCurrentView}
            t={t}
            upcomingGoals={upcomingGoals}
            language={language}
          />
        ) : null}

        {currentView === "goals" ? (
          <GoalsView
            addProgress={addProgress}
            copyGoal={copyGoal}
            filter={filter}
            filteredGoals={filteredGoals}
            language={language}
            markDone={markDone}
            openGoalDialog={openGoalDialog}
            openReview={openReview}
            reminders={reminders}
            selectedGoal={selectedGoal}
            setFilter={setFilter}
            setSelectedId={setSelectedId}
            setView={setView}
            t={t}
            view={view}
            coachText={coachText}
          />
        ) : null}

        {currentView === "calendar" ? <CalendarView goals={goals} language={language} t={t} /> : null}

        {currentView === "notes" ? (
          <NotesView addNote={addNote} noteDraft={noteDraft} notes={notes} setNoteDraft={setNoteDraft} t={t} />
        ) : null}

        {currentView === "finance" ? (
          <FinanceView
            addFinanceEntry={addFinanceEntry}
            expenseTotal={expenseTotal}
            financeDraft={financeDraft}
            financeEntries={financeEntries}
            formatMoney={(amount) => formatMoney(amount, language)}
            incomeTotal={incomeTotal}
            language={language}
            setFinanceDraft={setFinanceDraft}
            t={t}
          />
        ) : null}
      </main>

      {isGoalDialogOpen ? (
        <div className="modal-backdrop" role="presentation">
          <form className="goal-form modal" onSubmit={saveGoal}>
            <div className="dialog-head">
              <h2>{goalForm.id ? t.editGoal : t.createGoal}</h2>
              <button className="icon-btn" type="button" onClick={() => setGoalDialogOpen(false)} title={t.close}>
                <X size={17} />
              </button>
            </div>
            <div className="form-grid">
              <label className="field wide">
                <span>{t.title}</span>
                <input
                  required
                  maxLength={70}
                  placeholder={t.titlePlaceholder}
                  value={goalForm.title}
                  onChange={(event) => updateGoalForm("title", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.goalCategory}</span>
                <select
                  value={goalForm.category}
                  onChange={(event) => updateGoalForm("category", event.target.value as GoalCategory)}
                >
                  {Object.entries(t.category).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t.dueDate}</span>
                <input
                  required
                  type="datetime-local"
                  value={goalForm.dueDate}
                  onChange={(event) => updateGoalForm("dueDate", event.target.value)}
                />
              </label>
              <label className="field wide">
                <span>{t.notesField}</span>
                <textarea
                  rows={3}
                  placeholder={t.notesPlaceholder}
                  value={goalForm.notes}
                  onChange={(event) => updateGoalForm("notes", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.reward}</span>
                <input
                  placeholder={t.rewardPlaceholder}
                  value={goalForm.reward}
                  onChange={(event) => updateGoalForm("reward", event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.reminderTiming}</span>
                <select
                  value={goalForm.reminderPreset}
                  onChange={(event) => updateGoalForm("reminderPreset", Number(event.target.value))}
                >
                  {Object.entries(t.reminderOptions).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="dialog-actions">
              <button className="ghost" type="button" onClick={() => setGoalDialogOpen(false)}>
                {t.cancel}
              </button>
              <button className="primary" type="submit">
                {t.save}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {reviewGoalId ? (
        <div className="modal-backdrop" role="presentation">
          <form className="goal-form modal" onSubmit={submitReview}>
            <div className="dialog-head">
              <h2>{t.missedReview}</h2>
              <button className="icon-btn" type="button" onClick={() => setReviewGoalId(null)} title={t.close}>
                <X size={17} />
              </button>
            </div>
            <label className="field wide">
              <span>{t.comment}</span>
              <textarea
                rows={4}
                required
                placeholder={t.commentPlaceholder}
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
              />
            </label>
            <label className="field wide">
              <span>{t.extendReason}</span>
              <select value={extendReason} onChange={(event) => setExtendReason(event.target.value as ExtendReason)}>
                {Object.entries(t.reason).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field wide">
              <span>{t.newDueDate}</span>
              <input
                type="datetime-local"
                required
                value={extendedDate}
                onChange={(event) => setExtendedDate(event.target.value)}
              />
            </label>
            <div className="dialog-actions">
              <button className="ghost" type="button" onClick={() => finalizeReview("copy")}>
                <Copy size={15} />
                {t.copyAsNew}
              </button>
              <button className="primary" type="submit">
                {t.extend}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DashboardView({
  balance,
  expenseTotal,
  formatMoney,
  incomeTotal,
  notes,
  openGoalDialog,
  setCurrentView,
  t,
  upcomingGoals,
  language,
}: {
  balance: number;
  expenseTotal: number;
  formatMoney: (amount: number) => string;
  incomeTotal: number;
  notes: NoteItem[];
  openGoalDialog: () => void;
  setCurrentView: (view: ViewKey) => void;
  t: Texts;
  upcomingGoals: Goal[];
  language: Language;
}) {
  return (
    <section className="dashboard-grid">
      <div className="work-panel wide-panel">
        <div className="section-head">
          <h2>{t.dashboardTitle}</h2>
          <button className="primary small" onClick={openGoalDialog}>
            <Plus size={15} />
            {t.createGoal}
          </button>
        </div>
        <div className="summary-list">
          <button onClick={() => setCurrentView("calendar")}>
            <CalendarDays size={18} />
            <span>{t.nextDeadlines}</span>
            <strong>{upcomingGoals.length}</strong>
          </button>
          <button onClick={() => setCurrentView("notes")}>
            <StickyNote size={18} />
            <span>{t.notesTitle}</span>
            <strong>{notes.length}</strong>
          </button>
          <button onClick={() => setCurrentView("finance")}>
            <Wallet size={18} />
            <span>{t.balance}</span>
            <strong>{formatMoney(balance)}</strong>
          </button>
        </div>
      </div>

      <div className="work-panel">
        <h2>{t.nextDeadlines}</h2>
        <div className="stack-list">
          {upcomingGoals.length ? (
            upcomingGoals.map((goal) => (
              <div className="mini-row" key={goal.id}>
                <strong>{goal.title}</strong>
                <span>{formatDate(new Date(goal.dueDate), language)}</span>
              </div>
            ))
          ) : (
            <div className="empty compact-empty">{t.noUpcoming}</div>
          )}
        </div>
      </div>

      <div className="work-panel">
        <h2>{t.financeTitle}</h2>
        <div className="finance-mini">
          <span>{t.totalIncome}</span>
          <strong>{formatMoney(incomeTotal)}</strong>
          <span>{t.totalExpense}</span>
          <strong>{formatMoney(expenseTotal)}</strong>
        </div>
      </div>
    </section>
  );
}

function GoalsView({
  addProgress,
  coachText,
  copyGoal,
  filter,
  filteredGoals,
  language,
  markDone,
  openGoalDialog,
  openReview,
  reminders,
  selectedGoal,
  setFilter,
  setSelectedId,
  setView,
  t,
  view,
}: {
  addProgress: (goal: Goal) => void;
  coachText: () => string;
  copyGoal: (goal: Goal) => void;
  filter: GoalCategory | "all";
  filteredGoals: Goal[];
  language: Language;
  markDone: (goal: Goal) => void;
  openGoalDialog: (goal?: Goal) => void;
  openReview: (goal: Goal) => void;
  reminders: Array<{ goal: Goal; reminderAt: Date }>;
  selectedGoal: Goal | null;
  setFilter: (filter: GoalCategory | "all") => void;
  setSelectedId: (id: string) => void;
  setView: (view: GoalStatus) => void;
  t: Texts;
  view: GoalStatus;
}) {
  return (
    <section className="content-grid">
      <div className="goal-board">
        <div className="section-head">
          <h2>{t.goalList}</h2>
          <div className="segmented" role="group" aria-label={t.goalList}>
            {[
              ["active", t.active],
              ["done", t.completed],
              ["missed", t.missed],
            ].map(([status, label]) => (
              <button
                className={`segment ${view === status ? "active" : ""}`}
                key={status}
                onClick={() => setView(status as GoalStatus)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            {t.all}
          </button>
          {Object.entries(t.category).map(([key, label]) => (
            <button
              className={`chip ${filter === key ? "active" : ""}`}
              key={key}
              onClick={() => setFilter(key as GoalCategory)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="goal-list">
          {filteredGoals.length ? (
            filteredGoals.map((goal) => (
              <GoalCard
                addProgress={addProgress}
                copyGoal={copyGoal}
                goal={goal}
                key={goal.id}
                language={language}
                markDone={markDone}
                openGoalDialog={openGoalDialog}
                openReview={openReview}
                setSelectedId={setSelectedId}
                t={t}
              />
            ))
          ) : (
            <div className="empty">{t.emptyGoals}</div>
          )}
        </div>
      </div>

      <aside className="coach">
        <div className="section-head tight">
          <h2>{t.aiCoach}</h2>
          <button className="ghost small" onClick={() => selectedGoal && setSelectedId(selectedGoal.id)}>
            <Sparkles size={15} />
            {t.suggest}
          </button>
        </div>
        <div className="coach-card">
          {selectedGoal ? <strong>{selectedGoal.title}</strong> : null}
          <p>{coachText()}</p>
          {selectedGoal?.reward ? <p>{t.rewardSentence(selectedGoal.reward)}</p> : null}
        </div>
        <div className="calendar-box">
          <h3>{t.reminders}</h3>
          <div className="reminder-list">
            {reminders.length ? (
              reminders.map(({ goal, reminderAt }) => (
                <div className="reminder-item" key={goal.id}>
                  <strong>{goal.title}</strong>
                  <span>{formatDate(reminderAt, language)}</span>
                </div>
              ))
            ) : (
              <div className="empty compact-empty">{t.noReminders}</div>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}

function CalendarView({ goals, language, t }: { goals: Goal[]; language: Language; t: Texts }) {
  const calendarGoals = [...goals].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return (
    <section className="work-panel">
      <div className="section-head">
        <h2>{t.calendarTitle}</h2>
      </div>
      <div className="timeline-list">
        {calendarGoals.length ? (
          calendarGoals.map((goal) => (
            <div className="timeline-item" key={goal.id}>
              <time>{formatDate(new Date(goal.dueDate), language)}</time>
              <div>
                <strong>{goal.title}</strong>
                <span className={`pill ${goal.status === "missed" ? "danger" : goal.status === "active" ? "" : "warn"}`}>
                  {t.status[goal.status]}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">{t.calendarEmpty}</div>
        )}
      </div>
    </section>
  );
}

function NotesView({
  addNote,
  noteDraft,
  notes,
  setNoteDraft,
  t,
}: {
  addNote: (event: FormEvent<HTMLFormElement>) => void;
  noteDraft: { title: string; body: string };
  notes: NoteItem[];
  setNoteDraft: (draft: { title: string; body: string }) => void;
  t: Texts;
}) {
  return (
    <section className="two-column-work">
      <form className="work-panel stack-form" onSubmit={addNote}>
        <h2>{t.notesTitle}</h2>
        <label className="field">
          <span>{t.title}</span>
          <input
            placeholder={t.noteTitlePlaceholder}
            value={noteDraft.title}
            onChange={(event) => setNoteDraft({ ...noteDraft, title: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t.notesField}</span>
          <textarea
            rows={8}
            placeholder={t.noteBodyPlaceholder}
            value={noteDraft.body}
            onChange={(event) => setNoteDraft({ ...noteDraft, body: event.target.value })}
          />
        </label>
        <button className="primary" type="submit">
          <Plus size={16} />
          {t.addNote}
        </button>
      </form>

      <div className="work-panel stack-list">
        <h2>{t.notesTitle}</h2>
        {notes.length ? (
          notes.map((note) => (
            <article className="note-card" key={note.id}>
              <strong>{note.title}</strong>
              <p>{note.body}</p>
            </article>
          ))
        ) : (
          <div className="empty">{t.emptyNotes}</div>
        )}
      </div>
    </section>
  );
}

function FinanceView({
  addFinanceEntry,
  expenseTotal,
  financeDraft,
  financeEntries,
  formatMoney,
  incomeTotal,
  language,
  setFinanceDraft,
  t,
}: {
  addFinanceEntry: (event: FormEvent<HTMLFormElement>) => void;
  expenseTotal: number;
  financeDraft: { title: string; amount: string; kind: FinanceKind; memo: string };
  financeEntries: FinanceEntry[];
  formatMoney: (amount: number) => string;
  incomeTotal: number;
  language: Language;
  setFinanceDraft: (draft: { title: string; amount: string; kind: FinanceKind; memo: string }) => void;
  t: Texts;
}) {
  return (
    <section className="two-column-work">
      <form className="work-panel stack-form" onSubmit={addFinanceEntry}>
        <h2>{t.financeTitle}</h2>
        <label className="field">
          <span>{t.title}</span>
          <input
            required
            placeholder={t.financeNamePlaceholder}
            value={financeDraft.title}
            onChange={(event) => setFinanceDraft({ ...financeDraft, title: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t.amount}</span>
          <input
            required
            min="1"
            type="number"
            value={financeDraft.amount}
            onChange={(event) => setFinanceDraft({ ...financeDraft, amount: event.target.value })}
          />
        </label>
        <div className="segmented">
          <button
            className={`segment ${financeDraft.kind === "expense" ? "active" : ""}`}
            type="button"
            onClick={() => setFinanceDraft({ ...financeDraft, kind: "expense" })}
          >
            {t.expense}
          </button>
          <button
            className={`segment ${financeDraft.kind === "income" ? "active" : ""}`}
            type="button"
            onClick={() => setFinanceDraft({ ...financeDraft, kind: "income" })}
          >
            {t.income}
          </button>
        </div>
        <label className="field">
          <span>{t.memo}</span>
          <input value={financeDraft.memo} onChange={(event) => setFinanceDraft({ ...financeDraft, memo: event.target.value })} />
        </label>
        <button className="primary" type="submit">
          <Plus size={16} />
          {t.addEntry}
        </button>
      </form>

      <div className="work-panel">
        <h2>{t.financeTitle}</h2>
        <div className="finance-summary">
          <Stat label={t.balance} value={formatMoney(incomeTotal - expenseTotal)} />
          <Stat label={t.totalIncome} value={formatMoney(incomeTotal)} />
          <Stat label={t.totalExpense} value={formatMoney(expenseTotal)} />
        </div>
        <div className="stack-list">
          {financeEntries.length ? (
            financeEntries.map((entry) => (
              <div className="mini-row" key={entry.id}>
                <strong>{entry.title}</strong>
                <span>{formatDate(new Date(entry.date), language)}</span>
                <b className={entry.kind === "income" ? "money-plus" : "money-minus"}>
                  {entry.kind === "income" ? "+" : "-"}
                  {formatMoney(entry.amount)}
                </b>
              </div>
            ))
          ) : (
            <div className="empty">{t.emptyFinance}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function GoalCard({
  goal,
  setSelectedId,
  addProgress,
  markDone,
  copyGoal,
  openGoalDialog,
  openReview,
  language,
  t,
}: {
  goal: Goal;
  setSelectedId: (id: string) => void;
  addProgress: (goal: Goal) => void;
  markDone: (goal: Goal) => void;
  copyGoal: (goal: Goal) => void;
  openGoalDialog: (goal: Goal) => void;
  openReview: (goal: Goal) => void;
  language: Language;
  t: Texts;
}) {
  const due = new Date(goal.dueDate);
  const hours = hoursUntil(goal.dueDate);
  const isSoon = goal.status === "active" && hours >= 0 && hours <= 24;
  const latestReview = goal.reviews[goal.reviews.length - 1];

  return (
    <article className="goal-card" onClick={() => setSelectedId(goal.id)}>
      <div className="goal-top">
        <div>
          <div className="goal-title">{goal.title}</div>
          <div className="goal-meta">
            <span className="pill">{t.category[goal.category]}</span>
            {isSoon ? <span className="pill warn">{t.nearDue}</span> : null}
            {goal.status === "missed" ? <span className="pill danger">{t.status.missed}</span> : null}
            <span>{formatDate(due, language)}</span>
            {latestReview ? (
              <span>
                {t.previousReason}: {t.reason[latestReview.reason]}
              </span>
            ) : null}
          </div>
        </div>
        <div className="goal-actions" onClick={(event) => event.stopPropagation()}>
          {goal.status === "active" ? (
            <>
              <button className="ghost small" onClick={() => addProgress(goal)}>
                <RotateCcw size={15} />
                +25%
              </button>
              <button className="primary small" onClick={() => markDone(goal)}>
                <Check size={15} />
                {t.done}
              </button>
            </>
          ) : null}
          {goal.status === "missed" ? (
            <button className="ghost small" onClick={() => openReview(goal)}>
              {t.review}
            </button>
          ) : null}
          <button className="ghost small" onClick={() => copyGoal(goal)}>
            <Copy size={15} />
            {t.copy}
          </button>
          <button className="ghost small" onClick={() => openGoalDialog(goal)}>
            <Edit3 size={15} />
            {t.edit}
          </button>
        </div>
      </div>
      {goal.notes ? <p>{goal.notes}</p> : null}
      <div className="progress-wrap">
        <div className="progress-row">
          <span>{t.progress}</span>
          <span>{goal.progress}%</span>
        </div>
        <div className="progress">
          <span style={{ width: `${goal.progress}%` }} />
        </div>
      </div>
      {goal.reward ? (
        <div className="goal-meta">
          <span>
            {t.rewardPrefix}: {goal.reward}
          </span>
        </div>
      ) : null}
    </article>
  );
}

function soundFrequencies(type: SoundType) {
  return (
    {
      library: [174, 261],
      forest: [196, 329],
      exam: [220, 440],
      field: [164, 246],
      classroom: [185, 370],
      rain: [90, 130],
      off: [],
    } satisfies Record<SoundType, number[]>
  )[type];
}
