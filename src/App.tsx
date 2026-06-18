import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import {
  Bell,
  Bold,
  CalendarDays,
  Check,
  Code2,
  Copy,
  Edit3,
  Languages,
  LayoutDashboard,
  Minus,
  Plus,
  Quote,
  RotateCcw,
  Sparkles,
  StickyNote,
  Target,
  Timer,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  deleteRemoteGoal,
  deleteRemoteFinanceEntry,
  loadFocusStats,
  loadLocalGoals,
  loadRemoteFinanceEntries,
  loadRemoteGoals,
  saveRemoteFinanceEntries,
  saveFocusStats,
  saveLocalGoals,
  saveRemoteGoals,
} from "./storage";
import { isSupabaseConfigured } from "./supabaseClient";
import type { ExtendReason, FinanceEntry, FinanceKind, Goal, GoalCategory, GoalFormValues, GoalStatus, SoundType } from "./types";

type Language = "ja" | "en" | "zh";
type ViewKey = "dashboard" | "goals" | "calendar" | "notes" | "finance" | "code";
type CodeLanguage = "java" | "oracle" | "react" | "javascript";
type NoteKind = "idea" | "study" | "paste";

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  memo: string;
  createdAt: string;
};

type NoteItem = {
  id: string;
  kind?: NoteKind;
  themeId?: string;
  title: string;
  body: string;
  answers?: Record<string, string>;
  createdAt: string;
};

type CodeSnippet = {
  id: string;
  title: string;
  language: CodeLanguage;
  code: string;
  notes: string;
  result: string;
  updatedAt: string;
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
  reset: string;
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
  maxDailyFocus: string;
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
  delete: string;
  confirmDeleteGoal: string;
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
  ideaNotes: string;
  studyNotes: string;
  pasteNotes: string;
  noteTheme: string;
  noteTemplate: string;
  stickyPage: (page: number, total: number) => string;
  previousPage: string;
  nextPage: string;
  studyTemplateHint: string;
  confirmDeleteNote: string;
  yes: string;
  no: string;
  financeTitle: string;
  financeNamePlaceholder: string;
  entryDate: string;
  financeCategory: string;
  selectedDateDetails: string;
  monthDetails: string;
  previousMonth: string;
  nextMonth: string;
  todayExpense: string;
  monthExpense: string;
  amount: string;
  income: string;
  expense: string;
  memo: string;
  addEntry: string;
  balance: string;
  totalIncome: string;
  totalExpense: string;
  emptyFinance: string;
  codeTitle: string;
  codeLanguage: string;
  codeDisplay: string;
  codeNotes: string;
  codeResult: string;
  runCode: string;
  saveSnippet: string;
  snippetTitlePlaceholder: string;
  codePlaceholder: string;
  codeNotesPlaceholder: string;
  emptyCode: string;
  javascriptOnlyNotice: string;
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
      code: "Code",
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
    reset: "リセット",
    backgroundSound: "背景音",
    pageEyebrow: "RinaSpace",
    headline: "今日の小さな歩みを、静かに未来へつないでいく。",
    syncWaiting: "Supabase 接続待機中",
    syncLocal: "ローカル保存",
    syncDone: "Supabase 同期済み",
    allowNotifications: "通知を許可",
    createGoal: "目標を作成",
    active: "進行中",
    done: "達成",
    soon: "期限間近",
    todayFocus: "今日の集中",
    maxDailyFocus: "単日最大",
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
    delete: "削除",
    confirmDeleteGoal: "この目標を削除しますか？",
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
    ideaNotes: "アイデア記録",
    studyNotes: "学習ノート",
    pasteNotes: "貼り付けノート",
    noteTheme: "ノートテーマ",
    noteTemplate: "テーマテンプレート",
    stickyPage: (page, total) => `${page} / ${total}`,
    previousPage: "前へ",
    nextPage: "次へ",
    studyTemplateHint: "テーマを選ぶと、学習ノート用の問いが表示されます。",
    confirmDeleteNote: "本ノートの内容を削除しますか？",
    yes: "YES",
    no: "NO",
    financeTitle: "記帳",
    financeNamePlaceholder: "例：参考書、給料、カフェ",
    entryDate: "日付",
    financeCategory: "分類",
    selectedDateDetails: "選択日の明細",
    monthDetails: "当月の明細",
    previousMonth: "前月",
    nextMonth: "翌月",
    todayExpense: "本日支出",
    monthExpense: "今月支出",
    amount: "金額",
    income: "収入",
    expense: "支出",
    memo: "メモ",
    addEntry: "記録する",
    balance: "残高",
    totalIncome: "収入合計",
    totalExpense: "支出合計",
    emptyFinance: "記帳データはまだありません。",
    codeTitle: "コード管理",
    codeLanguage: "言語",
    codeDisplay: "コード表示",
    codeNotes: "学習ノート",
    codeResult: "実行結果",
    runCode: "実行",
    saveSnippet: "保存",
    snippetTitlePlaceholder: "例：配列を map で変換する",
    codePlaceholder: "コードを入力してください",
    codeNotesPlaceholder: "理解したこと、注意点、応用例を書く",
    emptyCode: "コード片はまだありません。",
    javascriptOnlyNotice: "JavaScript は簡易実行できます。Java / Oracle / React は学習プレビューとして表示します。",
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
      code: "Code",
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
    reset: "Reset",
    backgroundSound: "Background sound",
    pageEyebrow: "RinaSpace",
    headline: "Gather each small step today, and let it quietly become tomorrow.",
    syncWaiting: "Supabase pending",
    syncLocal: "Local storage",
    syncDone: "Supabase synced",
    allowNotifications: "Allow notifications",
    createGoal: "Create goal",
    active: "Active",
    done: "Done",
    soon: "Due soon",
    todayFocus: "Focus today",
    maxDailyFocus: "Single-day best",
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
    delete: "Delete",
    confirmDeleteGoal: "Do you want to delete this goal?",
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
    ideaNotes: "Idea notes",
    studyNotes: "Study notes",
    pasteNotes: "Paste notes",
    noteTheme: "Note theme",
    noteTemplate: "Theme template",
    stickyPage: (page, total) => `${page} / ${total}`,
    previousPage: "Previous",
    nextPage: "Next",
    studyTemplateHint: "Choose a theme to display a study-note template.",
    confirmDeleteNote: "Do you want to delete this note?",
    yes: "YES",
    no: "NO",
    financeTitle: "Finance",
    financeNamePlaceholder: "Example: textbook, salary, cafe",
    entryDate: "Date",
    financeCategory: "Category",
    selectedDateDetails: "Selected date details",
    monthDetails: "Monthly details",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    todayExpense: "Today's spending",
    monthExpense: "Monthly spending",
    amount: "Amount",
    income: "Income",
    expense: "Expense",
    memo: "Memo",
    addEntry: "Add entry",
    balance: "Balance",
    totalIncome: "Total income",
    totalExpense: "Total expense",
    emptyFinance: "No finance entries yet.",
    codeTitle: "Code Manager",
    codeLanguage: "Language",
    codeDisplay: "Code display",
    codeNotes: "Learning notes",
    codeResult: "Run result",
    runCode: "Run",
    saveSnippet: "Save",
    snippetTitlePlaceholder: "Example: Transform an array with map",
    codePlaceholder: "Write your code here",
    codeNotesPlaceholder: "Capture what you learned, caveats, and examples",
    emptyCode: "No code snippets yet.",
    javascriptOnlyNotice: "JavaScript can run in a simple sandbox. Java / Oracle / React show a learning preview.",
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
      code: "代码管理",
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
    reset: "重置",
    backgroundSound: "背景音",
    pageEyebrow: "RinaSpace",
    headline: "把今天的每一步，温柔地收藏成明天的光。",
    syncWaiting: "Supabase 等待连接",
    syncLocal: "本地保存",
    syncDone: "Supabase 已同步",
    allowNotifications: "允许通知",
    createGoal: "创建目标",
    active: "进行中",
    done: "达成",
    soon: "临近期限",
    todayFocus: "今日专注",
    maxDailyFocus: "单日专注最大",
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
    delete: "删除",
    confirmDeleteGoal: "是否要删除这个目标？",
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
    ideaNotes: "灵感记录",
    studyNotes: "学习笔记",
    pasteNotes: "贴图笔记",
    noteTheme: "笔记主题",
    noteTemplate: "主题模板",
    stickyPage: (page, total) => `${page} / ${total}`,
    previousPage: "上一页",
    nextPage: "下一页",
    studyTemplateHint: "选择主题后，会显示对应的学习笔记模板。",
    confirmDeleteNote: "是否要删除本笔记内容？",
    yes: "YES",
    no: "NO",
    financeTitle: "记账",
    financeNamePlaceholder: "例：参考书、工资、咖啡",
    entryDate: "日期",
    financeCategory: "分类",
    selectedDateDetails: "选中日期明细",
    monthDetails: "本月记账明细",
    previousMonth: "上个月",
    nextMonth: "下个月",
    todayExpense: "本日支出",
    monthExpense: "本月总支出",
    amount: "金额",
    income: "收入",
    expense: "支出",
    memo: "备注",
    addEntry: "记一笔",
    balance: "余额",
    totalIncome: "总收入",
    totalExpense: "总支出",
    emptyFinance: "还没有记账数据。",
    codeTitle: "代码管理",
    codeLanguage: "语言",
    codeDisplay: "代码显示",
    codeNotes: "学习笔记",
    codeResult: "运行结果",
    runCode: "运行",
    saveSnippet: "保存",
    snippetTitlePlaceholder: "例：用 map 转换数组",
    codePlaceholder: "在这里输入代码",
    codeNotesPlaceholder: "记录理解点、注意事项和应用例",
    emptyCode: "还没有代码片段。",
    javascriptOnlyNotice: "JavaScript 可进行简单运行。Java / Oracle / React 会显示学习预览。",
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
const codeStoreKey = "rinaspace-code-snippets-v1";
const calendarStoreKey = "rinaspace-calendar-events-v1";

const financeCategoryLabels: Record<Language, Record<string, string>> = {
  ja: {
    daily: "日常",
    food: "食費",
    transport: "交通",
    learning: "学習",
    salary: "給与",
    bonus: "ボーナス",
    other: "その他",
  },
  en: {
    daily: "Daily",
    food: "Food",
    transport: "Transport",
    learning: "Learning",
    salary: "Salary",
    bonus: "Bonus",
    other: "Other",
  },
  zh: {
    daily: "日常",
    food: "餐饮",
    transport: "交通",
    learning: "学习",
    salary: "工资",
    bonus: "奖金",
    other: "其他",
  },
};

const codeLanguageLabels: Record<CodeLanguage, string> = {
  java: "Java",
  oracle: "Oracle SQL",
  react: "React",
  javascript: "JavaScript",
};

const studyTemplates: Record<Language, Array<{ id: string; title: string; items: string[] }>> = {
  ja: [
    {
      id: "tool",
      title: "ツール類ノート",
      items: ["それは何か？", "何の問題を解決するために使うか？", "核心概念は何か？", "よく使う操作は何か？", "実務でどう使うか？", "よくある落とし穴は何か？", "ベストプラクティスは何か？", "自分の使用場面は何か？"],
    },
    {
      id: "tech-framework",
      title: "技術 / フレームワーク類ノート",
      items: ["それは何か？", "システムのどの層を担当するか？", "どんな技術課題を解決するか？", "核心概念 / アーキテクチャは何か？", "最小実行例は何か？", "よく使う設定は何か？", "実プロジェクトでどう使うか？", "よくあるエラーと調査方法は何か？", "面接ではどう聞かれるか？"],
    },
    {
      id: "syntax",
      title: "プログラミング文法類ノート",
      items: ["この文法は何か？", "なぜ必要か？", "基本の書き方は何か？", "よくある使い方は何か？", "似た文法との違いは何か？", "間違えやすい点はどこか？", "実コード例", "自分で一度書く"],
    },
    {
      id: "database-sql",
      title: "データベース / SQL 類ノート",
      items: ["このオブジェクト / 文法は何か？", "どんなデータ課題を解決するか？", "基本文法", "実務例", "実行順序 / 処理ロジック", "性能上の注意点", "よくあるエラー", "SQL の調査方法", "仕事で出会った実例"],
    },
    {
      id: "project-review",
      title: "プロジェクト経験 / 作業復盤ノート",
      items: ["問題現象は何か？", "影響範囲は何か？", "最初に疑った原因は何か？", "実際の原因は何か？", "調査過程", "最終的な解決方法", "関係する表 / プログラム / 設定", "次回どう避けるか？", "職務経歴書に書ける表現"],
    },
    {
      id: "interview",
      title: "面接準備類ノート",
      items: ["このポジションは何を求めているか？", "自分にはどんな一致経験があるか？", "不足点は何か？", "よく聞かれる質問", "自分の回答テンプレート", "プロジェクト経験をどう整理するか？", "日本語 / 英語表現", "面接官への逆質問"],
    },
    {
      id: "portfolio",
      title: "ポートフォリオ類ノート",
      items: ["プロジェクト名", "このプロジェクトは何を解決するか？", "使用技術", "システム構成", "核心機能", "データベース設計", "API 設計", "デプロイ方式", "出会った問題と解決方法", "面接官に見せられる亮点"],
    },
    {
      id: "japanese",
      title: "日本語学習類ノート",
      items: ["原文", "自然な表現", "中国語の意味", "ニュアンスの違い", "使用場面", "似た表現", "自分の例文"],
    },
    {
      id: "english",
      title: "英語学習類ノート",
      items: ["原文", "自然な表現", "中国語の意味", "ニュアンスの違い", "使用場面", "似た表現", "自分の例文"],
    },
  ],
  en: [
    { id: "tool", title: "Tool Notes", items: ["What is it?", "What problem does it solve?", "What are the core concepts?", "What are the most common operations?", "How is it used at work?", "What are common pitfalls?", "What are best practices?", "What is my own use case?"] },
    { id: "tech-framework", title: "Technology / Framework Notes", items: ["What is it?", "Which layer does it handle in the system?", "What technical problem does it solve?", "What are the core concepts / architecture?", "What is the smallest runnable example?", "What configurations are commonly used?", "How is it used in real projects?", "What are common errors and debugging methods?", "How might interviews ask about it?"] },
    { id: "syntax", title: "Programming Syntax Notes", items: ["What is this syntax?", "Why is it needed?", "What is the basic form?", "What are common uses?", "How is it different from similar syntax?", "Where is it easy to make mistakes?", "Real code example", "Write it once myself"] },
    { id: "database-sql", title: "Database / SQL Notes", items: ["What is this object / syntax?", "What data problem does it solve?", "Basic syntax", "Real business example", "Execution order / processing logic", "Performance notes", "Common errors", "How to debug SQL", "A real case from work"] },
    { id: "project-review", title: "Project Experience / Work Review Notes", items: ["What was the symptom?", "What was the impact scope?", "What was the first suspected cause?", "What was the actual cause?", "Investigation process", "Final solution", "Related tables / programs / configuration", "How to avoid it next time?", "Resume-ready expression"] },
    { id: "interview", title: "Interview Preparation Notes", items: ["What does this role require?", "Which matching experiences do I have now?", "What gaps exist?", "Common questions", "My answer template", "How to package project experience?", "Japanese / English expressions", "Questions to ask the interviewer"] },
    { id: "portfolio", title: "Portfolio Notes", items: ["Project name", "What problem does this project solve?", "Technologies used", "System architecture", "Core features", "Database design", "API design", "Deployment method", "Problems encountered and solutions", "Highlights to show interviewers"] },
    { id: "japanese", title: "Japanese Learning Notes", items: ["Original sentence", "Natural expression", "Chinese meaning", "Tone difference", "Usage scene", "Similar expressions", "My own example sentence"] },
    { id: "english", title: "English Learning Notes", items: ["Original sentence", "Natural expression", "Chinese meaning", "Tone difference", "Usage scene", "Similar expressions", "My own example sentence"] },
  ],
  zh: [
    { id: "tool", title: "工具类笔记", items: ["它是什么？", "它是用来解决什么问题的？", "它的核心概念是什么？", "最常用的操作是什么？", "实际工作中怎么用？", "常见坑是什么？", "最佳实践是什么？", "我自己的使用场景是什么？"] },
    { id: "tech-framework", title: "技术 / 框架类笔记", items: ["它是什么？", "它在系统里负责哪一层？", "它解决什么技术问题？", "核心概念 / 架构是什么？", "最小可运行例子是什么？", "常用配置是什么？", "实际项目中怎么用？", "常见错误和排查方法是什么？", "面试会怎么问？"] },
    { id: "syntax", title: "编程语法类笔记", items: ["这个语法是什么？", "为什么需要它？", "基本写法是什么？", "常见用法有哪些？", "和相似语法有什么区别？", "容易错在哪里？", "实际代码例子", "我自己写一遍"] },
    { id: "database-sql", title: "数据库 / SQL 类笔记", items: ["这个对象 / 语法是什么？", "用来解决什么数据问题？", "基本语法", "实际业务例子", "执行顺序 / 处理逻辑", "性能注意点", "常见错误", "排查 SQL 的方法", "工作中遇到的真实案例"] },
    { id: "project-review", title: "项目经验 / 工作复盘类笔记", items: ["问题现象是什么？", "影响范围是什么？", "最初怀疑原因是什么？", "实际原因是什么？", "调查过程", "最终解决方法", "涉及到的表 / 程序 / 配置", "下次怎么避免？", "可以写进简历的表达"] },
    { id: "interview", title: "面试准备类笔记", items: ["这个岗位要求什么？", "我现在有哪些匹配经验？", "缺口是什么？", "常问问题", "我的回答模板", "项目经验怎么包装？", "日语 / 英语表达", "反问面试官的问题"] },
    { id: "portfolio", title: "作品集类笔记", items: ["项目名称", "这个项目解决什么问题？", "使用技术", "系统架构", "核心功能", "数据库设计", "API 设计", "部署方式", "遇到的问题和解决方法", "可以展示给面试官的亮点"] },
    { id: "japanese", title: "日语学习类笔记", items: ["原句", "自然表达", "中文意思", "语气区别", "使用场景", "相似表达", "我自己的例句"] },
    { id: "english", title: "英语学习类笔记", items: ["原句", "自然表达", "中文意思", "语气区别", "使用场景", "相似表达", "我自己的例句"] },
  ],
};

const defaultCode = `const scores = [82, 95, 67];
const passed = scores.filter((score) => score >= 80);
console.log(passed);`;

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toDateKey(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, nth: number) {
  const first = new Date(year, monthIndex, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
}

function baseJapaneseHoliday(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const springEquinox = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  const autumnEquinox = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));

  if (month === 1 && (day === 1 || day === nthWeekdayOfMonth(year, 0, 1, 2))) return true;
  if (month === 2 && (day === 11 || day === 23)) return true;
  if (month === 3 && day === springEquinox) return true;
  if (month === 4 && day === 29) return true;
  if (month === 5 && [3, 4, 5].includes(day)) return true;
  if (month === 7 && day === nthWeekdayOfMonth(year, 6, 1, 3)) return true;
  if (month === 8 && day === 11) return true;
  if (month === 9 && (day === nthWeekdayOfMonth(year, 8, 1, 3) || day === autumnEquinox)) return true;
  if (month === 10 && day === nthWeekdayOfMonth(year, 9, 1, 2)) return true;
  if (month === 11 && (day === 3 || day === 23)) return true;
  return false;
}

function isJapaneseHoliday(date: Date) {
  if (baseJapaneseHoliday(date)) return true;

  const previous = new Date(date);
  previous.setDate(date.getDate() - 1);
  const next = new Date(date);
  next.setDate(date.getDate() + 1);
  if (baseJapaneseHoliday(previous) && baseJapaneseHoliday(next)) return true;

  const cursor = new Date(date);
  cursor.setDate(date.getDate() - 1);
  while (cursor.getMonth() === date.getMonth() || cursor.getDate() >= 1) {
    if (!baseJapaneseHoliday(cursor)) return false;
    if (cursor.getDay() === 0) return true;
    cursor.setDate(cursor.getDate() - 1);
  }

  return false;
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

type CompanionScene = "desk" | "grass" | "meal" | "sleep" | "bedRead";

function getCompanionScene(date = new Date()): CompanionScene {
  const hour = date.getHours();
  if (hour >= 22 || hour < 7) return "sleep";
  if (hour < 12) return "desk";
  if (hour < 13) return "meal";
  if (hour < 17) return "grass";
  if (hour < 18) return "meal";
  return "bedRead";
}

function CompanionWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(handle);
  }, []);

  const scene = getCompanionScene(now);
  const sceneText: Record<CompanionScene, string> = {
    sleep: "すやすや",
    desk: "朝の読書",
    meal: "ごはん",
    grass: "芝生で読書",
    bedRead: "夜の読書",
  };
  const sceneProp: Record<CompanionScene, ReactNode> = {
    sleep: <span className="companion-bed" />,
    desk: <span className="companion-desk" />,
    meal: <span className="companion-table" />,
    grass: <span className="companion-grass" />,
    bedRead: <span className="companion-bed reading" />,
  };
  const showBook = scene === "desk" || scene === "grass" || scene === "bedRead";

  return (
    <section className={`companion-widget ${scene}`} aria-label="Rina companion">
      <div className="companion-stage">
        {sceneProp[scene]}
        <div className="companion-girl">
          <span className="companion-hair" />
          <span className="companion-face" />
          <span className="companion-dress" />
          {showBook ? <span className="companion-book" /> : null}
          {scene === "meal" ? <span className="companion-bowl" /> : null}
          {scene === "sleep" ? <span className="companion-sleep-mark">Zz</span> : null}
        </div>
      </div>
      <div className="companion-caption">
        <strong>Rina</strong>
        <span>{sceneText[scene]}</span>
      </div>
    </section>
  );
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function nodeToHtml(node: ChildNode) {
  const wrapper = document.createElement("div");
  wrapper.appendChild(node.cloneNode(true));
  return wrapper.innerHTML;
}

function splitPasteHtmlIntoPages(html: string, maxPageWeight = 1800) {
  if (!html.trim()) return [""];

  const template = document.createElement("template");
  template.innerHTML = html;
  const pages: string[] = [];
  let currentHtml = "";
  let currentWeight = 0;

  function pushCurrent() {
    if (!currentHtml.trim()) return;
    pages.push(currentHtml);
    currentHtml = "";
    currentWeight = 0;
  }

  Array.from(template.content.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      for (let start = 0; start < text.length; start += maxPageWeight) {
        const chunk = text.slice(start, start + maxPageWeight);
        if (currentWeight + chunk.length > maxPageWeight) pushCurrent();
        currentHtml += escapeHtml(chunk);
        currentWeight += chunk.length;
      }
      return;
    }

    const htmlChunk = nodeToHtml(node);
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null;
    const hasImage = node.nodeName.toLowerCase() === "img" || Boolean(element?.querySelector("img"));
    const weight = Math.max((node.textContent ?? "").length, hasImage ? maxPageWeight : 80);

    if (currentWeight && currentWeight + weight > maxPageWeight) pushCurrent();
    currentHtml += htmlChunk;
    currentWeight += weight;

    if (hasImage) pushCurrent();
  });

  pushCurrent();
  return pages.length ? pages : [html];
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
  const [noteMode, setNoteMode] = useState<NoteKind>("idea");
  const [goals, setGoals] = useState<Goal[]>(() => loadLocalGoals(buildInitialGoals(translations.ja)));
  const [notes, setNotes] = useState<NoteItem[]>(() => readJson(notesStoreKey, []));
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(() => readJson(financeStoreKey, []));
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>(() => readJson(codeStoreKey, []));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => readJson(calendarStoreKey, []));
  const [filter, setFilter] = useState<GoalCategory | "all">("all");
  const [view, setView] = useState<GoalStatus>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormValues>(() => emptyGoalForm());
  const [isGoalDialogOpen, setGoalDialogOpen] = useState(false);
  const [reviewGoalId, setReviewGoalId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [extendReason, setExtendReason] = useState<ExtendReason>("scope");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusStats, setFocusStats] = useState(() => loadFocusStats(toDateKey(new Date())));
  const [soundType, setSoundType] = useState<SoundType>("off");
  const [syncStatus, setSyncStatus] = useState<"waiting" | "local" | "synced">(
    isSupabaseConfigured ? "waiting" : "local",
  );
  const [noteDraft, setNoteDraft] = useState({
    kind: "idea" as NoteKind,
    themeId: "tool",
    title: "",
    body: "",
    answers: {} as Record<string, string>,
  });
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [editingPasteId, setEditingPasteId] = useState<string | null>(null);
  const [isStudyEditing, setStudyEditing] = useState(true);
  const [isPasteEditing, setPasteEditing] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [ideaPage, setIdeaPage] = useState(1);
  const [financeDraft, setFinanceDraft] = useState({
    title: "",
    amount: "",
    kind: "expense" as FinanceKind,
    date: toDateKey(new Date()),
    category: "daily",
    memo: "",
  });
  const [editingFinanceId, setEditingFinanceId] = useState<string | null>(null);
  const [codeDraft, setCodeDraft] = useState({
    title: "",
    language: "javascript" as CodeLanguage,
    code: defaultCode,
    notes: "",
  });
  const [codeResult, setCodeResult] = useState("");
  const audioRef = useRef<{ context: AudioContext; oscillators: OscillatorNode[] } | null>(null);
  const creditedFocusMinutesRef = useRef(0);

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
    let alive = true;

    loadRemoteFinanceEntries().then((remoteEntries) => {
      if (!alive || !remoteEntries?.length) return;
      setFinanceEntries(remoteEntries);
      localStorage.setItem(financeStoreKey, JSON.stringify(remoteEntries));
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

    if (!isSupabaseConfigured) {
      setSyncStatus("local");
      return;
    }

    setSyncStatus("waiting");
    saveRemoteGoals(goals).then((saved) => {
      setSyncStatus(saved ? "synced" : "local");
    });
  }, [goals, t]);

  useEffect(() => {
    localStorage.setItem(notesStoreKey, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(financeStoreKey, JSON.stringify(financeEntries));
    saveRemoteFinanceEntries(financeEntries);
  }, [financeEntries]);

  useEffect(() => {
    localStorage.setItem(codeStoreKey, JSON.stringify(codeSnippets));
  }, [codeSnippets]);

  useEffect(() => {
    localStorage.setItem(calendarStoreKey, JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    if (!timerRunning) return undefined;

    const handle = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        const nextSeconds = Math.max(0, seconds - 1);
        const elapsedSeconds = timerTotal - nextSeconds;
        const earnedMinutes = Math.floor(elapsedSeconds / (5 * 60)) * 5;
        const minutesToAdd = earnedMinutes - creditedFocusMinutesRef.current;

        if (minutesToAdd > 0) {
          creditedFocusMinutesRef.current = earnedMinutes;
          addFocusMinutes(minutesToAdd);
        }

        if (seconds <= 1) {
          window.clearInterval(handle);
          setTimerRunning(false);
          stopSound();
          playPing();
          notify(t.focusDoneTitle, t.focusDoneBody);
          creditedFocusMinutesRef.current = 0;
          return timerTotal;
        }
        return nextSeconds;
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
  const currentDateKey = toDateKey(new Date());
  const focusMinutes = focusStats[currentDateKey] ?? 0;
  const maxDailyFocus = Math.max(0, ...Object.values(focusStats));
  const currentMonthKey = monthKey(new Date());
  const todayExpense = financeEntries
    .filter((entry) => entry.kind === "expense" && toDateKey(new Date(entry.date)) === currentDateKey)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const monthExpense = financeEntries
    .filter((entry) => entry.kind === "expense" && monthKey(new Date(entry.date)) === currentMonthKey)
    .reduce((sum, entry) => sum + entry.amount, 0);
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

  function addFocusMinutes(minutes: number) {
    setFocusStats((stats) => {
      const todayKey = toDateKey(new Date());
      const next = {
        ...stats,
        [todayKey]: (stats[todayKey] ?? 0) + minutes,
      };
      saveFocusStats(next);
      return next;
    });
  }

  function updateGoalForm<K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) {
    setGoalForm((current) => ({ ...current, [key]: value }));
  }

  function openGoalStatus(status: GoalStatus) {
    setCurrentView("goals");
    setView(status);
    setFilter("all");
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

  function deleteGoal(goal: Goal) {
    if (!window.confirm(t.confirmDeleteGoal)) return;

    setGoals((current) => current.filter((item) => item.id !== goal.id));
    setSelectedId((current) => (current === goal.id ? null : current));
    deleteRemoteGoal(goal.id).then((deleted) => {
      if (isSupabaseConfigured) setSyncStatus(deleted ? "synced" : "local");
    });
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
    const originalDueDate = new Date(goal.dueDate);
    const next: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      title: `${goal.title}${titleSuffix}`,
      dueDate: originalDueDate.getTime() > Date.now() ? goal.dueDate : toLocalInputValue(addMinutes(new Date(), 60 * 24)),
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
  }

  function saveReview() {
    const goal = goals.find((item) => item.id === reviewGoalId);
    if (!goal) return;

    const review = {
      comment: reviewComment.trim(),
      reason: extendReason,
      date: new Date().toISOString(),
    };

    setGoals((current) =>
      current.map((item) => (item.id === goal.id ? { ...item, reviews: [...item.reviews, review] } : item)),
    );
    setReviewGoalId(null);
  }

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveReview();
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteDraft.title.trim() && !noteDraft.body.trim()) return;
    const nextNote: NoteItem = {
      id: editingIdeaId ?? crypto.randomUUID(),
      kind: "idea",
      title: noteDraft.title.trim() || t.notesTitle,
      body: noteDraft.body.trim(),
      createdAt: new Date().toISOString(),
    };
    setNotes((current) =>
      editingIdeaId ? current.map((note) => (note.id === editingIdeaId ? nextNote : note)) : [nextNote, ...current],
    );
    setEditingIdeaId(null);
    setIdeaPage(1);
    setNoteDraft((current) => ({ ...current, kind: "idea", title: "", body: "" }));
  }

  function saveStudyNote() {
    const template = studyTemplates[language].find((item) => item.id === noteDraft.themeId) ?? studyTemplates[language][0];
    const hasAnswers = Object.values(noteDraft.answers).some((value) => stripHtml(value));
    if (!noteDraft.title.trim() && !hasAnswers) return;

    const nextNote: NoteItem = {
      id: editingStudyId ?? crypto.randomUUID(),
      kind: "study",
      themeId: template.id,
      title: noteDraft.title.trim() || template.title,
      body: "",
      answers: noteDraft.answers,
      createdAt: new Date().toISOString(),
    };

    setNotes((current) =>
      editingStudyId ? current.map((note) => (note.id === editingStudyId ? nextNote : note)) : [nextNote, ...current],
    );
    setEditingStudyId(null);
    setStudyEditing(true);
    setNoteDraft((current) => ({ ...current, kind: "study", title: "", body: "", answers: {} }));
  }

  function selectStudyNote(note: NoteItem) {
    setEditingStudyId(note.id);
    setStudyEditing(false);
    setNoteDraft({
      kind: "study",
      themeId: note.themeId ?? "tool",
      title: note.title,
      body: "",
      answers: note.answers ?? {},
    });
  }

  function savePasteNote() {
    const strippedBody = noteDraft.body.replace(/<[^>]*>/g, "").trim();
    const hasImage = /<img[\s>]/i.test(noteDraft.body);
    if (!noteDraft.title.trim() && !strippedBody && !hasImage) return;

    const nextNote: NoteItem = {
      id: editingPasteId ?? crypto.randomUUID(),
      kind: "paste",
      title: noteDraft.title.trim() || t.pasteNotes,
      body: noteDraft.body,
      createdAt: new Date().toISOString(),
    };

    setNotes((current) =>
      editingPasteId ? current.map((note) => (note.id === editingPasteId ? nextNote : note)) : [nextNote, ...current],
    );
    setEditingPasteId(null);
    setPasteEditing(true);
    setNoteDraft((current) => ({ ...current, kind: "paste", title: "", body: "", answers: {} }));
  }

  function selectPasteNote(note: NoteItem) {
    setEditingPasteId(note.id);
    setPasteEditing(false);
    setNoteDraft({
      kind: "paste",
      themeId: "tool",
      title: note.title,
      body: note.body,
      answers: {},
    });
  }

  function beginStudyEdit() {
    if (!editingStudyId) return;
    setStudyEditing(true);
  }

  function beginPasteEdit() {
    if (!editingPasteId) return;
    setPasteEditing(true);
  }

  function openIdeaNotes() {
    setCurrentView("notes");
    setNoteMode("idea");
    setEditingStudyId(null);
    setEditingPasteId(null);
    setStudyEditing(true);
    setPasteEditing(true);
    setNoteDraft({ kind: "idea", themeId: "tool", title: "", body: "", answers: {} });
  }

  function openStudyNotes() {
    setCurrentView("notes");
    setNoteMode("study");
    setEditingIdeaId(null);
    setEditingPasteId(null);
    setNoteDraft({ kind: "study", themeId: "tool", title: "", body: "", answers: {} });
    setEditingStudyId(null);
    setStudyEditing(true);
    setPasteEditing(true);
  }

  function openPasteNotes() {
    setCurrentView("notes");
    setNoteMode("paste");
    setEditingIdeaId(null);
    setEditingStudyId(null);
    setStudyEditing(true);
    setNoteDraft({ kind: "paste", themeId: "tool", title: "", body: "", answers: {} });
    setEditingPasteId(null);
    setPasteEditing(true);
  }

  function selectIdeaNote(note: NoteItem) {
    setEditingIdeaId(note.id);
    setNoteDraft((current) => ({
      ...current,
      kind: "idea",
      title: note.title,
      body: note.body,
    }));
  }

  function requestDeleteNote(id: string) {
    setPendingDeleteId(id);
  }

  function deleteNote(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id));
    if (editingIdeaId === id) {
      setEditingIdeaId(null);
      setNoteDraft((current) => ({ ...current, kind: "idea", title: "", body: "" }));
    }
    if (editingStudyId === id) {
      setEditingStudyId(null);
      setStudyEditing(true);
      setNoteDraft((current) => ({ ...current, kind: "study", title: "", body: "", answers: {} }));
    }
    if (editingPasteId === id) {
      setEditingPasteId(null);
      setPasteEditing(true);
      setNoteDraft((current) => ({ ...current, kind: "paste", title: "", body: "", answers: {} }));
    }
    setPendingDeleteId(null);
  }

  function addFinanceEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(financeDraft.amount);
    if (!financeDraft.title.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const existing = financeEntries.find((entry) => entry.id === editingFinanceId);
    const nextEntry: FinanceEntry = {
      id: editingFinanceId ?? crypto.randomUUID(),
      title: financeDraft.title.trim(),
      amount,
      kind: financeDraft.kind,
      category: financeDraft.category,
      memo: financeDraft.memo.trim(),
      date: new Date(`${financeDraft.date}T12:00:00`).toISOString(),
    };
    setFinanceEntries((current) =>
      existing ? current.map((entry) => (entry.id === existing.id ? nextEntry : entry)) : [nextEntry, ...current],
    );
    resetFinanceDraft();
  }

  function editFinanceEntry(entry: FinanceEntry) {
    setEditingFinanceId(entry.id);
    setFinanceDraft({
      title: entry.title,
      amount: String(entry.amount),
      kind: entry.kind,
      date: toDateKey(new Date(entry.date)),
      category: entry.category || "daily",
      memo: entry.memo,
    });
    setCurrentView("finance");
  }

  function deleteFinanceEntry(id: string) {
    setFinanceEntries((current) => current.filter((entry) => entry.id !== id));
    deleteRemoteFinanceEntry(id);
    if (editingFinanceId === id) resetFinanceDraft();
  }

  function resetFinanceDraft() {
    setEditingFinanceId(null);
    setFinanceDraft({ title: "", amount: "", kind: "expense", date: toDateKey(new Date()), category: "daily", memo: "" });
  }

  function runCode() {
    if (codeDraft.language !== "javascript") {
      const preview = [
        `${codeLanguageLabels[codeDraft.language]} preview`,
        codeDraft.code.split("\n").slice(0, 8).join("\n"),
        "",
        t.javascriptOnlyNotice,
      ].join("\n");
      setCodeResult(preview);
      return;
    }

    const logs: string[] = [];
    try {
      const runner = new Function("console", `"use strict";\n${codeDraft.code}`);
      runner({
        log: (...values: unknown[]) => logs.push(values.map((value) => formatConsoleValue(value)).join(" ")),
      });
      setCodeResult(logs.length ? logs.join("\n") : "Done");
    } catch (error) {
      setCodeResult(error instanceof Error ? error.message : String(error));
    }
  }

  function saveCodeSnippet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!codeDraft.title.trim() && !codeDraft.code.trim()) return;
    const next: CodeSnippet = {
      id: crypto.randomUUID(),
      title: codeDraft.title.trim() || codeLanguageLabels[codeDraft.language],
      language: codeDraft.language,
      code: codeDraft.code,
      notes: codeDraft.notes,
      result: codeResult,
      updatedAt: new Date().toISOString(),
    };
    setCodeSnippets((current) => [next, ...current]);
  }

  function adjustTimer(minutes: number) {
    if (timerRunning) return;
    const next = Math.max(5 * 60, Math.min(120 * 60, timerTotal + minutes * 60));
    creditedFocusMinutesRef.current = 0;
    setTimerTotal(next);
    setTimerSeconds(next);
  }

  function toggleTimer() {
    setTimerRunning((running) => {
      if (!running && timerSeconds === timerTotal) {
        creditedFocusMinutesRef.current = 0;
      }
      return !running;
    });
  }

  function resetTimer() {
    setTimerRunning(false);
    stopSound();
    creditedFocusMinutesRef.current = 0;
    setTimerSeconds(timerTotal);
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
    { key: "code", icon: Code2 },
  ];
  const showStatsGrid = currentView !== "notes" && currentView !== "code";

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
            <div className="module-nav-group" key={key}>
              <button
                className={`module-nav-item ${currentView === key ? "active" : ""}`}
                onClick={() => {
                  setCurrentView(key);
                  if (key === "notes") openIdeaNotes();
                }}
              >
                <Icon size={17} />
                {t.nav[key]}
              </button>
              {key === "notes" ? (
                <div className="submenu">
                  <button
                    className={currentView === "notes" && noteMode === "idea" ? "active" : ""}
                    onClick={openIdeaNotes}
                  >
                    {t.ideaNotes}
                  </button>
                  <button
                    className={currentView === "notes" && noteMode === "study" ? "active" : ""}
                    onClick={openStudyNotes}
                  >
                    {t.studyNotes}
                  </button>
                  <button
                    className={currentView === "notes" && noteMode === "paste" ? "active" : ""}
                    onClick={openPasteNotes}
                  >
                    {t.pasteNotes}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <section className="focus-panel">
          <div className="focus-head">
            <div>
              <span className="eyebrow">{t.focusTimer}</span>
              <h2>{t.shortFocus}</h2>
            </div>
            <button className="icon-btn mini-icon" onClick={resetTimer} title={t.reset} type="button">
              <RotateCcw size={15} />
            </button>
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
        <CompanionWidget />
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

        {showStatsGrid ? (
            <section className="stats-grid" aria-label={t.dashboardTitle}>
              <Stat label={t.active} value={activeGoals.length} onClick={() => openGoalStatus("active")} />
              <Stat label={t.done} value={doneGoals.length} onClick={() => openGoalStatus("done")} />
              <Stat label={t.todayExpense} value={formatMoney(todayExpense, language)} />
              <Stat label={t.monthExpense} value={formatMoney(monthExpense, language)} />
              <Stat label={t.todayFocus} value={`${focusMinutes}m`} meta={`${t.maxDailyFocus} ${maxDailyFocus}m`} />
            </section>
        ) : null}

        {currentView === "dashboard" ? (
          <DashboardView
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
            deleteGoal={deleteGoal}
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

        {currentView === "calendar" ? (
          <CalendarView calendarEvents={calendarEvents} goals={goals} language={language} setCalendarEvents={setCalendarEvents} t={t} />
        ) : null}

        {currentView === "notes" ? (
          <NotesView
            addNote={addNote}
            beginPasteEdit={beginPasteEdit}
            beginStudyEdit={beginStudyEdit}
            deleteNote={deleteNote}
            editingIdeaId={editingIdeaId}
            editingPasteId={editingPasteId}
            editingStudyId={editingStudyId}
            ideaPage={ideaPage}
            isPasteEditing={isPasteEditing}
            isStudyEditing={isStudyEditing}
            key={noteMode}
            language={language}
            noteMode={noteMode}
            noteDraft={noteDraft}
            notes={notes}
            pendingDeleteId={pendingDeleteId}
            requestDeleteNote={requestDeleteNote}
            savePasteNote={savePasteNote}
            saveStudyNote={saveStudyNote}
            selectIdeaNote={selectIdeaNote}
            selectPasteNote={selectPasteNote}
            selectStudyNote={selectStudyNote}
            setIdeaPage={setIdeaPage}
            setPendingDeleteId={setPendingDeleteId}
            setNoteDraft={setNoteDraft}
            t={t}
          />
        ) : null}

        {currentView === "finance" ? (
          <FinanceView
            addFinanceEntry={addFinanceEntry}
            deleteFinanceEntry={deleteFinanceEntry}
            editFinanceEntry={editFinanceEntry}
            editingFinanceId={editingFinanceId}
            financeDraft={financeDraft}
            financeEntries={financeEntries}
            formatMoney={(amount) => formatMoney(amount, language)}
            language={language}
            resetFinanceDraft={resetFinanceDraft}
            setFinanceDraft={setFinanceDraft}
            t={t}
          />
        ) : null}

        {currentView === "code" ? (
          <CodeView
            codeDraft={codeDraft}
            codeResult={codeResult}
            codeSnippets={codeSnippets}
            language={language}
            runCode={runCode}
            saveCodeSnippet={saveCodeSnippet}
            setCodeDraft={setCodeDraft}
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
              <h2>{t.review}</h2>
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
            <div className="dialog-actions">
              <button className="ghost" type="button" onClick={() => setReviewGoalId(null)}>
                {t.cancel}
              </button>
              <button className="primary" type="submit">
                {t.save}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  meta,
  onClick,
  value,
}: {
  label: string;
  meta?: string;
  onClick?: () => void;
  value: number | string;
}) {
  const content = (
    <>
      <div className="stat-head">
        <span>{label}</span>
        {meta ? <small>{meta}</small> : null}
      </div>
      <strong>{value}</strong>
    </>
  );

  return onClick ? (
    <button className="stat stat-button" onClick={onClick} type="button">
      {content}
    </button>
  ) : (
    <article className="stat">{content}</article>
  );
}

function DashboardView({
  notes,
  openGoalDialog,
  setCurrentView,
  t,
  upcomingGoals,
  language,
}: {
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
    </section>
  );
}

function GoalsView({
  addProgress,
  coachText,
  copyGoal,
  deleteGoal,
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
  deleteGoal: (goal: Goal) => void;
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
                deleteGoal={deleteGoal}
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

function CalendarView({
  calendarEvents,
  goals,
  language,
  setCalendarEvents,
  t,
}: {
  calendarEvents: CalendarEvent[];
  goals: Goal[];
  language: Language;
  setCalendarEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  t: Texts;
}) {
  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState({ title: "", startTime: "09:00", endTime: "10:00", memo: "" });
  const locale = language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US";
  const copy = {
    ja: {
      selectedDate: "選択中の日付",
      scheduleList: "予定リスト",
      relatedGoals: "この日の目標",
      noSchedules: "この日の予定はありません。",
      newSchedule: "新しい予定",
      addSchedule: "予定を追加",
      updateSchedule: "予定を保存",
      startTime: "開始時間",
      endTime: "終了時間",
      titlePlaceholder: "例：学習、面談、レビュー",
      memoPlaceholder: "場所、準備物、メモなど",
    },
    en: {
      selectedDate: "Selected date",
      scheduleList: "Schedule list",
      relatedGoals: "Goals on this day",
      noSchedules: "No schedules for this day.",
      newSchedule: "New schedule",
      addSchedule: "Add schedule",
      updateSchedule: "Save schedule",
      startTime: "Start time",
      endTime: "End time",
      titlePlaceholder: "Example: study, meeting, review",
      memoPlaceholder: "Location, preparation, notes",
    },
    zh: {
      selectedDate: "当前选择日期",
      scheduleList: "日程列表",
      relatedGoals: "当天目标",
      noSchedules: "当天暂无日程。",
      newSchedule: "新日程",
      addSchedule: "新增日程",
      updateSchedule: "保存日程",
      startTime: "开始时间",
      endTime: "结束时间",
      titlePlaceholder: "例：学习、面谈、复盘",
      memoPlaceholder: "地点、准备事项、备注",
    },
  }[language];
  const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
  const monthTitle = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(visibleMonth);
  const selectedDateLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${selectedDate}T00:00:00`));

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstVisible = new Date(year, month, 1 - firstOfMonth.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisible);
      date.setDate(firstVisible.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const selectedEvents = calendarEvents
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => `${a.startTime}${a.endTime}`.localeCompare(`${b.startTime}${b.endTime}`));
  const selectedGoals = goals
    .filter((goal) => toDateKey(new Date(goal.dueDate)) === selectedDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const currentMonth = monthKey(visibleMonth);

  function resetEventDraft() {
    setEditingEventId(null);
    setEventDraft({ title: "", startTime: "09:00", endTime: "10:00", memo: "" });
  }

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDay(date: Date) {
    setSelectedDate(toDateKey(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    resetEventDraft();
  }

  function saveCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventDraft.title.trim()) return;
    const existing = calendarEvents.find((item) => item.id === editingEventId);
    const nextEvent: CalendarEvent = {
      id: editingEventId ?? crypto.randomUUID(),
      date: selectedDate,
      title: eventDraft.title.trim(),
      startTime: eventDraft.startTime,
      endTime: eventDraft.endTime,
      memo: eventDraft.memo.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    setCalendarEvents((current) =>
      existing ? current.map((item) => (item.id === existing.id ? nextEvent : item)) : [nextEvent, ...current],
    );
    resetEventDraft();
  }

  function editCalendarEvent(event: CalendarEvent) {
    setEditingEventId(event.id);
    setEventDraft({ title: event.title, startTime: event.startTime, endTime: event.endTime, memo: event.memo });
  }

  function deleteCalendarEvent(id: string) {
    setCalendarEvents((current) => current.filter((event) => event.id !== id));
    if (editingEventId === id) resetEventDraft();
  }

  return (
    <section className="calendar-workspace">
      <div className="work-panel month-calendar">
        <div className="calendar-month-head">
          <button className="icon-btn" onClick={() => changeMonth(-1)} type="button" aria-label="Previous month">
            {"‹"}
          </button>
          <div>
            <span>{visibleMonth.getFullYear()}</span>
            <h2>{monthTitle}</h2>
          </div>
          <button className="icon-btn" onClick={() => changeMonth(1)} type="button" aria-label="Next month">
            {"›"}
          </button>
        </div>

        <div className="calendar-weekdays" aria-hidden="true">
          {weekdayLabels.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="month-grid">
          {calendarDays.map((date) => {
            const dateKey = toDateKey(date);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const isCurrentMonth = monthKey(date) === currentMonth;
            const hasEvents = calendarEvents.some((event) => event.date === dateKey);
            const isSaturday = date.getDay() === 6;
            const isSunday = date.getDay() === 0;
            const isHoliday = isJapaneseHoliday(date);
            return (
              <button
                className={`calendar-day ${isCurrentMonth ? "" : "muted"} ${isSaturday ? "saturday" : ""} ${isSunday ? "sunday" : ""} ${isHoliday ? "holiday" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                key={dateKey}
                onClick={() => selectDay(date)}
                type="button"
              >
                <span>{date.getDate()}</span>
                {hasEvents ? <i aria-label="Has schedule" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="work-panel schedule-panel">
        <div className="section-head">
          <div>
            <span className="eyebrow">{copy.selectedDate}</span>
            <h2>{selectedDateLabel}</h2>
          </div>
        </div>

        <div className="schedule-columns">
          <div className="schedule-list">
            <h3>{copy.scheduleList}</h3>
            {selectedEvents.length ? (
              selectedEvents.map((event) => (
                <article className={`schedule-card ${editingEventId === event.id ? "active" : ""}`} key={event.id}>
                  <div className="schedule-time">
                    <strong>{event.startTime}</strong>
                    <span>{event.endTime}</span>
                  </div>
                  <div>
                    <strong>{event.title}</strong>
                    {event.memo ? <p>{event.memo}</p> : null}
                    <div className="schedule-actions">
                      <button className="ghost small" onClick={() => editCalendarEvent(event)} type="button">
                        {t.edit}
                      </button>
                      <button className="ghost small danger-action" onClick={() => deleteCalendarEvent(event.id)} type="button">
                        {t.delete}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty compact-empty">{copy.noSchedules}</div>
            )}

            <h3>{copy.relatedGoals}</h3>
            {selectedGoals.length ? (
              selectedGoals.map((goal) => (
                <div className="timeline-item compact-timeline" key={goal.id}>
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
              <div className="empty compact-empty">{t.calendarEmpty}</div>
            )}
          </div>

          <form className="schedule-form" onSubmit={saveCalendarEvent}>
            <div className="section-head tight">
              <h3>{editingEventId ? copy.updateSchedule : copy.newSchedule}</h3>
              {editingEventId ? (
                <button className="ghost small" onClick={resetEventDraft} type="button">
                  {t.cancel}
                </button>
              ) : null}
            </div>
            <label className="field">
              <span>{t.title}</span>
              <input
                placeholder={copy.titlePlaceholder}
                value={eventDraft.title}
                onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <div className="time-fields">
              <label className="field">
                <span>{copy.startTime}</span>
                <input
                  type="time"
                  value={eventDraft.startTime}
                  onChange={(event) => setEventDraft((current) => ({ ...current, startTime: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>{copy.endTime}</span>
                <input
                  type="time"
                  value={eventDraft.endTime}
                  onChange={(event) => setEventDraft((current) => ({ ...current, endTime: event.target.value }))}
                />
              </label>
            </div>
            <label className="field">
              <span>{t.memo}</span>
              <textarea
                rows={5}
                placeholder={copy.memoPlaceholder}
                value={eventDraft.memo}
                onChange={(event) => setEventDraft((current) => ({ ...current, memo: event.target.value }))}
              />
            </label>
            <button className="primary" type="submit">
              <Plus size={16} />
              {editingEventId ? copy.updateSchedule : copy.addSchedule}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function NotesView({
  addNote,
  beginPasteEdit,
  beginStudyEdit,
  deleteNote,
  editingIdeaId,
  editingPasteId,
  editingStudyId,
  ideaPage,
  isPasteEditing,
  isStudyEditing,
  language,
  noteMode,
  noteDraft,
  notes,
  pendingDeleteId,
  requestDeleteNote,
  savePasteNote,
  saveStudyNote,
  selectIdeaNote,
  selectPasteNote,
  selectStudyNote,
  setIdeaPage,
  setPendingDeleteId,
  setNoteDraft,
  t,
}: {
  addNote: (event: FormEvent<HTMLFormElement>) => void;
  beginPasteEdit: () => void;
  beginStudyEdit: () => void;
  deleteNote: (id: string) => void;
  editingIdeaId: string | null;
  editingPasteId: string | null;
  editingStudyId: string | null;
  isStudyEditing: boolean;
  isPasteEditing: boolean;
  ideaPage: number;
  language: Language;
  noteMode: NoteKind;
  noteDraft: { kind: NoteKind; themeId: string; title: string; body: string; answers: Record<string, string> };
  notes: NoteItem[];
  pendingDeleteId: string | null;
  requestDeleteNote: (id: string) => void;
  savePasteNote: () => void;
  saveStudyNote: () => void;
  selectIdeaNote: (note: NoteItem) => void;
  selectPasteNote: (note: NoteItem) => void;
  selectStudyNote: (note: NoteItem) => void;
  setIdeaPage: (page: number) => void;
  setPendingDeleteId: (id: string | null) => void;
  setNoteDraft: Dispatch<
    SetStateAction<{ kind: NoteKind; themeId: string; title: string; body: string; answers: Record<string, string> }>
  >;
  t: Texts;
}) {
  const templates = studyTemplates[language];
  const studyDraft = noteDraft.kind === "study" ? noteDraft : { kind: "study" as NoteKind, themeId: "tool", title: "", body: "", answers: {} };
  const selectedTemplate = templates.find((template) => template.id === studyDraft.themeId) ?? templates[0];
  const ideaNotes = notes.filter((note) => (note.kind ?? "idea") === "idea");
  const studyNotes = notes.filter((note) => note.kind === "study");
  const pasteNotes = notes.filter((note) => note.kind === "paste");
  const totalPages = Math.max(1, Math.ceil(ideaNotes.length / 15));
  const safePage = Math.min(ideaPage, totalPages);
  const visibleIdeas = ideaNotes.slice((safePage - 1) * 15, safePage * 15);
  const selectedStudyNote = studyNotes.find((note) => note.id === editingStudyId) ?? null;
  const selectedPasteNote = pasteNotes.find((note) => note.id === editingPasteId) ?? null;
  const isStudyReadOnly = Boolean(selectedStudyNote && !isStudyEditing);
  const isPasteReadOnly = Boolean(selectedPasteNote && !isPasteEditing);
  const pasteEditorRef = useRef<HTMLDivElement | null>(null);
  const studyEditorRef = useRef<HTMLDivElement | null>(null);
  const [pastePage, setPastePage] = useState(1);
  const [activeStudyQuestion, setActiveStudyQuestion] = useState(0);
  const pasteBody = noteDraft.kind === "paste" ? noteDraft.body : "";
  const pastePages = useMemo(
    () => (isPasteReadOnly ? splitPasteHtmlIntoPages(pasteBody) : [pasteBody]),
    [isPasteReadOnly, pasteBody],
  );
  const pasteTotalPages = Math.max(1, pastePages.length);
  const safePastePage = Math.min(pastePage, pasteTotalPages);
  const visiblePasteHtml = pastePages[safePastePage - 1] ?? "";
  const activeQuestionIndex = Math.min(activeStudyQuestion, Math.max(0, selectedTemplate.items.length - 1));
  const activeQuestion = selectedTemplate.items[activeQuestionIndex] ?? "";
  const activeAnswerKey = `${selectedTemplate.id}-${activeQuestionIndex}`;
  const activeAnswer = studyDraft.answers?.[activeAnswerKey] ?? "";

  useEffect(() => {
    if (noteMode === noteDraft.kind) return;

    if (noteMode === "study") {
      setNoteDraft({ kind: "study", themeId: "tool", title: "", body: "", answers: {} });
      return;
    }

    if (noteMode === "paste") {
      setNoteDraft({ kind: "paste", themeId: "tool", title: "", body: "", answers: {} });
      return;
    }

    setNoteDraft({ kind: "idea", themeId: "tool", title: "", body: "", answers: {} });
  }, [noteDraft.kind, noteMode, setNoteDraft]);

  useEffect(() => {
    const editor = pasteEditorRef.current;
    if (noteMode !== "paste" || !editor) return;

    if (editor.innerHTML !== noteDraft.body) {
      editor.innerHTML = noteDraft.body;
    }
  }, [editingPasteId, noteDraft.body, noteMode]);

  useEffect(() => {
    if (noteMode !== "paste") {
      pasteEditorRef.current?.replaceChildren();
      return;
    }

    return () => {
      pasteEditorRef.current?.replaceChildren();
    };
  }, [noteMode]);

  useEffect(() => {
    setPastePage(1);
  }, [editingPasteId, isPasteReadOnly, noteMode]);

  useEffect(() => {
    if (pastePage > pasteTotalPages) setPastePage(pasteTotalPages);
  }, [pastePage, pasteTotalPages]);

  useEffect(() => {
    setActiveStudyQuestion(0);
  }, [selectedTemplate.id]);

  useEffect(() => {
    if (activeStudyQuestion >= selectedTemplate.items.length) {
      setActiveStudyQuestion(Math.max(0, selectedTemplate.items.length - 1));
    }
  }, [activeStudyQuestion, selectedTemplate.items.length]);

  useEffect(() => {
    const editor = studyEditorRef.current;
    if (noteMode !== "study" || !editor) return;
    if (editor.innerHTML !== activeAnswer) {
      editor.innerHTML = activeAnswer;
    }
  }, [activeAnswer, activeAnswerKey, noteMode]);

  function updatePasteBody() {
    if (noteMode !== "paste") return;
    const body = pasteEditorRef.current?.innerHTML ?? "";
    setNoteDraft((current) => (current.kind === "paste" ? { ...current, body } : current));
  }

  function insertPasteHtml(html: string) {
    pasteEditorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    updatePasteBody();
  }

  function escapePasteText(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br>");
  }

  function handlePasteEditorPaste(event: ClipboardEvent<HTMLDivElement>) {
    if (isPasteReadOnly) return;
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    event.preventDefault();

    if (!imageFiles.length) {
      const text = event.clipboardData.getData("text/plain");
      if (text) insertPasteHtml(escapePasteText(text));
      return;
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        insertPasteHtml(`<img src="${reader.result}" alt="pasted image">`);
      };
      reader.readAsDataURL(file);
    });
  }

  function updateStudyAnswer() {
    const html = studyEditorRef.current?.innerHTML ?? "";
    setNoteDraft((current) => {
      const base = current.kind === "study" ? current : studyDraft;
      return {
        ...base,
        kind: "study",
        answers: { ...(base.answers ?? {}), [activeAnswerKey]: html },
      };
    });
  }

  function applyStudyFormat(command: "bold" | "formatBlock", value?: string) {
    if (isStudyReadOnly) return;
    studyEditorRef.current?.focus();
    document.execCommand(command, false, value);
    updateStudyAnswer();
  }

  function applyStudyColor(color: string) {
    if (isStudyReadOnly) return;
    studyEditorRef.current?.focus();
    document.execCommand("foreColor", false, color);
    updateStudyAnswer();
  }

  if (noteMode === "paste") {
    return (
      <section className="paste-notes-workspace">
        <div className="work-panel paste-editor-panel">
          <div className="section-head">
            <h2>{t.pasteNotes}</h2>
            <div className="study-actions">
              {isPasteReadOnly ? (
                <button className="ghost small" onClick={beginPasteEdit} type="button">
                  {t.edit}
                </button>
              ) : (
                <button className="primary small" onClick={savePasteNote} type="button">
                  {t.save}
                </button>
              )}
              <button
                className="ghost small danger-action"
                disabled={!editingPasteId}
                onClick={() => editingPasteId && requestDeleteNote(editingPasteId)}
                type="button"
              >
                {t.delete}
              </button>
            </div>
          </div>

          <label className="field">
            <span>{t.title}</span>
            <input
              placeholder={t.noteTitlePlaceholder}
              value={noteDraft.kind === "paste" ? noteDraft.title : ""}
              disabled={isPasteReadOnly}
              onChange={(event) => setNoteDraft({ ...noteDraft, kind: "paste", title: event.target.value })}
            />
          </label>

          {isPasteReadOnly ? (
            <>
              <div
                aria-label={t.pasteNotes}
                className="paste-page readonly"
                dangerouslySetInnerHTML={{ __html: visiblePasteHtml }}
                role="article"
              />
              <div className="pager paste-pager">
                <button className="ghost small" disabled={safePastePage <= 1} onClick={() => setPastePage(safePastePage - 1)} type="button">
                  {t.previousPage}
                </button>
                <span>{t.stickyPage(safePastePage, pasteTotalPages)}</span>
                <button className="ghost small" disabled={safePastePage >= pasteTotalPages} onClick={() => setPastePage(safePastePage + 1)} type="button">
                  {t.nextPage}
                </button>
              </div>
            </>
          ) : (
            <div
              aria-label={t.pasteNotes}
              className="paste-page"
              contentEditable
              onInput={updatePasteBody}
              onPaste={handlePasteEditorPaste}
              ref={pasteEditorRef}
              role="textbox"
              suppressContentEditableWarning
            />
          )}
        </div>

        <aside className="work-panel stack-list">
          <h2>{t.pasteNotes}</h2>
          {pasteNotes.length ? (
            pasteNotes.map((note) => (
              <button className={`study-note-card ${editingPasteId === note.id ? "active" : ""}`} key={note.id} onClick={() => selectPasteNote(note)}>
                <strong>{note.title}</strong>
                <span>{formatDate(new Date(note.createdAt), language)}</span>
              </button>
            ))
          ) : (
            <div className="empty compact-empty">{t.emptyNotes}</div>
          )}
        </aside>
        {pendingDeleteId ? (
          <div className="confirm-backdrop" role="presentation">
            <div className="confirm-dialog">
              <p>{t.confirmDeleteNote}</p>
              <div className="dialog-actions">
                <button className="ghost" onClick={() => setPendingDeleteId(null)} type="button">
                  {t.no}
                </button>
                <button className="primary" onClick={() => deleteNote(pendingDeleteId)} type="button">
                  {t.yes}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  if (noteMode === "study") {
    return (
      <section className="study-notes-workspace">
        <div className="work-panel study-editor">
          <div className="section-head">
            <label className="field theme-select">
              <span>{t.noteTheme}</span>
              <select
                value={studyDraft.themeId}
                disabled={isStudyReadOnly}
                onChange={(event) =>
                  setNoteDraft({ ...studyDraft, kind: "study", themeId: event.target.value, answers: {} })
                }
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="study-actions">
              {isStudyReadOnly ? (
                <button className="ghost small" onClick={beginStudyEdit} type="button">
                  {t.edit}
                </button>
              ) : (
                <button className="primary small" onClick={saveStudyNote} type="button">
                  {t.save}
                </button>
              )}
              <button
                className="ghost small danger-action"
                disabled={!editingStudyId}
                onClick={() => editingStudyId && requestDeleteNote(editingStudyId)}
                type="button"
              >
                {t.delete}
              </button>
            </div>
          </div>

          <label className="field">
            <span>{t.title}</span>
            <input
              placeholder={selectedTemplate.title}
              value={studyDraft.title}
              disabled={isStudyReadOnly}
              onChange={(event) => setNoteDraft({ ...studyDraft, kind: "study", title: event.target.value })}
            />
          </label>

          <div className="study-answer-tabs" role="tablist" aria-label={t.noteTemplate}>
            {selectedTemplate.items.map((item, index) => {
              const key = `${selectedTemplate.id}-${index}`;
              const hasAnswer = Boolean(stripHtml(studyDraft.answers?.[key] ?? ""));
              return (
                <button
                  className={`${activeQuestionIndex === index ? "active" : ""} ${hasAnswer ? "filled" : ""}`}
                  key={key}
                  onClick={() => setActiveStudyQuestion(index)}
                  role="tab"
                  type="button"
                >
                  <span>{index + 1}</span>
                  {item}
                </button>
              );
            })}
          </div>

          <section className="study-answer-editor">
            <div className="study-answer-head">
              <h3>{activeQuestion}</h3>
              <div className="rich-toolbar" aria-label="Study note formatting">
                <button className="icon-btn" disabled={isStudyReadOnly} onClick={() => applyStudyFormat("bold")} title="Bold" type="button">
                  <Bold size={16} />
                </button>
                <button
                  className="icon-btn"
                  disabled={isStudyReadOnly}
                  onClick={() => applyStudyFormat("formatBlock", "blockquote")}
                  title="Quote"
                  type="button"
                >
                  <Quote size={16} />
                </button>
                {["#192028", "#d84a3f", "#1f74d1", "#16736b", "#8b5cf6"].map((color) => (
                  <button
                    aria-label={`Text color ${color}`}
                    className="color-swatch"
                    disabled={isStudyReadOnly}
                    key={color}
                    onClick={() => applyStudyColor(color)}
                    style={{ background: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div
              aria-label={activeQuestion}
              className={`study-rich-editor ${isStudyReadOnly ? "readonly" : ""}`}
              contentEditable={!isStudyReadOnly}
              onInput={updateStudyAnswer}
              ref={studyEditorRef}
              role="textbox"
              suppressContentEditableWarning
            />
          </section>
        </div>

        <aside className="work-panel stack-list">
          <h2>{t.studyNotes}</h2>
          {studyNotes.length ? (
            studyNotes.map((note) => (
              <button className={`study-note-card ${editingStudyId === note.id ? "active" : ""}`} key={note.id} onClick={() => selectStudyNote(note)}>
                <strong>{note.title}</strong>
                <span>{templates.find((template) => template.id === note.themeId)?.title ?? t.studyNotes}</span>
              </button>
            ))
          ) : (
            <div className="empty compact-empty">{t.emptyNotes}</div>
          )}
        </aside>
        {pendingDeleteId ? (
          <div className="confirm-backdrop" role="presentation">
            <div className="confirm-dialog">
              <p>{t.confirmDeleteNote}</p>
              <div className="dialog-actions">
                <button className="ghost" onClick={() => setPendingDeleteId(null)} type="button">
                  {t.no}
                </button>
                <button className="primary" onClick={() => deleteNote(pendingDeleteId)} type="button">
                  {t.yes}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="notes-workspace">
      <form className="work-panel stack-form note-compose" onSubmit={addNote}>
        <div className="section-head">
          <h2>{t.ideaNotes}</h2>
        </div>
        <label className="field">
          <span>{t.title}</span>
          <input
            placeholder={t.noteTitlePlaceholder}
            value={noteDraft.kind === "idea" ? noteDraft.title : ""}
            onChange={(event) => setNoteDraft({ ...noteDraft, kind: "idea", title: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t.notesField}</span>
          <textarea
            rows={8}
            placeholder={t.noteBodyPlaceholder}
            value={noteDraft.kind === "idea" ? noteDraft.body : ""}
            onChange={(event) => setNoteDraft({ ...noteDraft, kind: "idea", body: event.target.value })}
          />
        </label>
        <button className="primary" type="submit">
          <Plus size={16} />
          {editingIdeaId ? t.save : t.addNote}
        </button>
      </form>

      <div className="work-panel">
        <div className="section-head">
          <h2>{t.ideaNotes}</h2>
          <div className="pager">
            <button className="ghost small" disabled={safePage <= 1} onClick={() => setIdeaPage(safePage - 1)}>
              {t.previousPage}
            </button>
            <span>{t.stickyPage(safePage, totalPages)}</span>
            <button className="ghost small" disabled={safePage >= totalPages} onClick={() => setIdeaPage(safePage + 1)}>
              {t.nextPage}
            </button>
          </div>
        </div>
        {visibleIdeas.length ? (
          <div className="sticky-grid">
            {visibleIdeas.map((note) => (
              <article className={`sticky-note ${editingIdeaId === note.id ? "active" : ""}`} key={note.id} onClick={() => selectIdeaNote(note)}>
                <button className="delete-note" onClick={(event) => { event.stopPropagation(); requestDeleteNote(note.id); }} title={t.delete} type="button">
                  <X size={14} />
                </button>
                <strong>{note.title}</strong>
                <p>{note.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">{t.emptyNotes}</div>
        )}
      </div>
      {pendingDeleteId ? (
        <div className="confirm-backdrop" role="presentation">
          <div className="confirm-dialog">
            <p>{t.confirmDeleteNote}</p>
            <div className="dialog-actions">
              <button className="ghost" onClick={() => setPendingDeleteId(null)} type="button">
                {t.no}
              </button>
              <button className="primary" onClick={() => deleteNote(pendingDeleteId)} type="button">
                {t.yes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FinanceView({
  addFinanceEntry,
  deleteFinanceEntry,
  editFinanceEntry,
  editingFinanceId,
  financeDraft,
  financeEntries,
  formatMoney,
  language,
  resetFinanceDraft,
  setFinanceDraft,
  t,
}: {
  addFinanceEntry: (event: FormEvent<HTMLFormElement>) => void;
  deleteFinanceEntry: (id: string) => void;
  editFinanceEntry: (entry: FinanceEntry) => void;
  editingFinanceId: string | null;
  financeDraft: { title: string; amount: string; kind: FinanceKind; date: string; category: string; memo: string };
  financeEntries: FinanceEntry[];
  formatMoney: (amount: number) => string;
  language: Language;
  resetFinanceDraft: () => void;
  setFinanceDraft: (draft: { title: string; amount: string; kind: FinanceKind; date: string; category: string; memo: string }) => void;
  t: Texts;
}) {
  const todayKey = toDateKey(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const locale = language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US";
  const monthTitle = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(visibleMonth);
  const currentMonth = monthKey(visibleMonth);
  const categoryLabels = financeCategoryLabels[language];
  const monthEntries = financeEntries
    .filter((entry) => monthKey(new Date(entry.date)) === currentMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const selectedDateEntries = monthEntries.filter((entry) => toDateKey(new Date(entry.date)) === selectedDate);
  const visibleEntries = selectedDateEntries.length ? selectedDateEntries : monthEntries;
  const monthIncome = monthEntries.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const monthExpense = monthEntries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const monthDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstVisible = new Date(year, month, 1 - firstOfMonth.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisible);
      date.setDate(firstVisible.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  function changeMonth(offset: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(toDateKey(next));
  }

  function dayTotals(date: Date) {
    const dateKey = toDateKey(date);
    const entries = financeEntries.filter((entry) => toDateKey(new Date(entry.date)) === dateKey);
    return {
      income: entries.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0),
      expense: entries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0),
    };
  }

  function selectFinanceDate(dateKey: string) {
    setSelectedDate(dateKey);
    setFinanceDraft({ ...financeDraft, date: dateKey });
  }

  return (
    <section className="finance-workspace">
      <div className="finance-left-column">
        <form className="work-panel stack-form finance-form" onSubmit={addFinanceEntry}>
          <div className="section-head tight">
            <h2>{t.financeTitle}</h2>
            {editingFinanceId ? (
              <button className="ghost small" onClick={resetFinanceDraft} type="button">
                {t.cancel}
              </button>
            ) : null}
          </div>

          <div className="finance-form-grid">
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
            <label className="field">
              <span>{t.entryDate}</span>
              <input
                required
                type="date"
                value={financeDraft.date}
                onChange={(event) => setFinanceDraft({ ...financeDraft, date: event.target.value })}
              />
            </label>
            <label className="field">
              <span>{t.financeCategory}</span>
              <select
                value={financeDraft.category}
                onChange={(event) => setFinanceDraft({ ...financeDraft, category: event.target.value })}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
            {editingFinanceId ? t.save : t.addEntry}
          </button>
        </form>

        <div className="work-panel finance-detail-panel">
          <div className="section-head">
            <h2>{selectedDateEntries.length ? t.selectedDateDetails : t.monthDetails}</h2>
          </div>
          <div className="stack-list">
            {visibleEntries.length ? (
              visibleEntries.map((entry) => (
                <article className="finance-entry-card" key={entry.id}>
                  <div>
                    <strong>{entry.title}</strong>
                    <span>
                      {formatDate(new Date(entry.date), language)} · {categoryLabels[entry.category] ?? entry.category}
                    </span>
                    {entry.memo ? <p>{entry.memo}</p> : null}
                  </div>
                  <b className={entry.kind === "income" ? "money-plus" : "money-minus"}>
                    {entry.kind === "income" ? "+" : "-"}
                    {formatMoney(entry.amount)}
                  </b>
                  <div className="finance-entry-actions">
                    <button className="ghost small" onClick={() => editFinanceEntry(entry)} type="button">
                      {t.edit}
                    </button>
                    <button className="ghost small danger-action" onClick={() => deleteFinanceEntry(entry.id)} type="button">
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">{t.emptyFinance}</div>
            )}
          </div>
        </div>
      </div>

      <div className="work-panel finance-calendar-panel">
        <div className="calendar-month-head finance-month-head">
          <button className="icon-btn" onClick={() => changeMonth(-1)} type="button" aria-label={t.previousMonth}>
            {"‹"}
          </button>
          <h2>{monthTitle}</h2>
          <button className="icon-btn" onClick={() => changeMonth(1)} type="button" aria-label={t.nextMonth}>
            {"›"}
          </button>
        </div>

        <div className="finance-summary">
          <Stat label={t.totalIncome} value={formatMoney(monthIncome)} />
          <Stat label={t.totalExpense} value={formatMoney(monthExpense)} />
          <Stat label={t.balance} value={formatMoney(monthIncome - monthExpense)} />
        </div>

        <div className="calendar-weekdays" aria-hidden="true">
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="finance-calendar-grid">
          {monthDays.map((date) => {
            const dateKey = toDateKey(date);
            const totals = dayTotals(date);
            const inMonth = monthKey(date) === currentMonth;
            const selected = dateKey === selectedDate;
            return (
              <button
                className={`finance-day ${inMonth ? "" : "muted"} ${selected ? "selected" : ""}`}
                key={dateKey}
                onClick={() => selectFinanceDate(dateKey)}
                type="button"
              >
                <span>{date.getDate()}</span>
                <div>
                  {totals.expense ? <b className="money-minus">-{Math.round(totals.expense).toLocaleString()}</b> : null}
                  {totals.income ? <b className="money-plus">{Math.round(totals.income).toLocaleString()}</b> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </section>
  );
}

function CodeView({
  codeDraft,
  codeResult,
  codeSnippets,
  language,
  runCode,
  saveCodeSnippet,
  setCodeDraft,
  t,
}: {
  codeDraft: { title: string; language: CodeLanguage; code: string; notes: string };
  codeResult: string;
  codeSnippets: CodeSnippet[];
  language: Language;
  runCode: () => void;
  saveCodeSnippet: (event: FormEvent<HTMLFormElement>) => void;
  setCodeDraft: (draft: { title: string; language: CodeLanguage; code: string; notes: string }) => void;
  t: Texts;
}) {
  return (
    <section className="code-workspace">
      <form className="code-main work-panel" onSubmit={saveCodeSnippet}>
        <div className="section-head">
          <h2>{t.codeTitle}</h2>
          <div className="top-actions">
            <button className="ghost small" type="button" onClick={runCode}>
              <Timer size={15} />
              {t.runCode}
            </button>
            <button className="primary small" type="submit">
              <Plus size={15} />
              {t.saveSnippet}
            </button>
          </div>
        </div>

        <div className="code-editor-grid">
          <section className="code-pane">
            <div className="code-toolbar">
              <label className="field">
                <span>{t.title}</span>
                <input
                  placeholder={t.snippetTitlePlaceholder}
                  value={codeDraft.title}
                  onChange={(event) => setCodeDraft({ ...codeDraft, title: event.target.value })}
                />
              </label>
              <label className="field">
                <span>{t.codeLanguage}</span>
                <select
                  value={codeDraft.language}
                  onChange={(event) => setCodeDraft({ ...codeDraft, language: event.target.value as CodeLanguage })}
                >
                  {Object.entries(codeLanguageLabels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field code-field">
              <span>{t.codeDisplay}</span>
              <textarea
                className="code-input"
                spellCheck={false}
                placeholder={t.codePlaceholder}
                value={codeDraft.code}
                onChange={(event) => setCodeDraft({ ...codeDraft, code: event.target.value })}
              />
            </label>
          </section>

          <aside className="note-pane">
            <label className="field code-field">
              <span>{t.codeNotes}</span>
              <textarea
                placeholder={t.codeNotesPlaceholder}
                value={codeDraft.notes}
                onChange={(event) => setCodeDraft({ ...codeDraft, notes: event.target.value })}
              />
            </label>
            <p className="helper-text">{t.javascriptOnlyNotice}</p>
          </aside>
        </div>

        <section className="result-pane">
          <div className="section-head tight">
            <h3>{t.codeResult}</h3>
          </div>
          <pre>{codeResult || t.codeResult}</pre>
        </section>
      </form>

      <aside className="work-panel code-library">
        <h2>{t.codeTitle}</h2>
        <div className="stack-list">
          {codeSnippets.length ? (
            codeSnippets.map((snippet) => (
              <button
                className="snippet-card"
                key={snippet.id}
                onClick={() =>
                  setCodeDraft({
                    title: snippet.title,
                    language: snippet.language,
                    code: snippet.code,
                    notes: snippet.notes,
                  })
                }
              >
                <strong>{snippet.title}</strong>
                <span>{codeLanguageLabels[snippet.language]}</span>
                <small>{formatDate(new Date(snippet.updatedAt), language)}</small>
              </button>
            ))
          ) : (
            <div className="empty compact-empty">{t.emptyCode}</div>
          )}
        </div>
      </aside>
    </section>
  );
}

function GoalCard({
  goal,
  setSelectedId,
  addProgress,
  markDone,
  copyGoal,
  deleteGoal,
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
  deleteGoal: (goal: Goal) => void;
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
          {goal.status === "done" || goal.status === "missed" ? (
            <button className="ghost small" onClick={() => openReview(goal)}>
              {t.review}
            </button>
          ) : null}
          <button className="ghost small" onClick={() => copyGoal(goal)}>
            <Copy size={15} />
            {t.copy}
          </button>
          {goal.status === "active" ? (
            <button className="ghost small" onClick={() => openGoalDialog(goal)}>
              <Edit3 size={15} />
              {t.edit}
            </button>
          ) : null}
          <button className="ghost small danger-action" onClick={() => deleteGoal(goal)}>
            <Trash2 size={15} />
            {t.delete}
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

function formatConsoleValue(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
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
