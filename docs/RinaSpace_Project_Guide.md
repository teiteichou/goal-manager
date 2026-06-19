# RinaSpace Project Guide

## 项目是什么

RinaSpace 是一个个人目标、日程、笔记、记账、代码片段学习管理应用。当前是 React 原型阶段，重点是把日常学习和生活管理功能集中在一个桌面 Web 应用里。

## 当前主要功能

- Dashboard：首页概览目标、今日支出、本日专注、近期事项。
- Goals：目标新增、编辑、完成、未达成复盘、复制、删除。
- Calendar：月历视图，按日期新增、编辑、删除日程，并显示当天相关目标。
- Notes：灵感记录、学习笔记、贴图笔记。
- Finance：支出/收入记录、日历统计、选中日期明细。
- Code：代码片段管理、学习笔记、JavaScript 简易运行结果。
- Focus Timer：短时专注计时和每日专注统计。
- i18n：日文、英文、中文切换。

## 技术栈

- React 18
- TypeScript
- Vite
- Supabase JavaScript client
- lucide-react icons
- localStorage fallback

## 运行命令

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```

常用本地地址：

- Vite dev: `http://127.0.0.1:5173/`
- Vite preview: `http://127.0.0.1:4173/` 或指定端口

## 目录结构说明

```text
src/
  app/
    App.tsx              # 当前主应用容器，仍承载大部分页面组合逻辑
    AppLayout.tsx        # 后续布局抽取目标
    navigation.ts        # 主菜单定义
    types.ts             # App 层语言/视图类型
  features/
    dashboard/           # 首页模块目标目录
    goals/               # 目标模块类型和工具
    calendar/            # 日历模块类型和工具
    notes/               # 笔记模块类型和工具
    finance/             # 记账模块类型和工具
    code/                # 代码管理模块类型和运行工具
  shared/
    components/          # 通用 Button / Field / Modal / ConfirmDialog / SegmentedControl
    hooks/               # 通用 hooks
    services/            # storage 兼容导出
    utils/               # date / money / html 工具
  styles/
    globals.css
    layout.css
    dashboard.css
    goals.css
    calendar.css
    notes.css
    finance.css
    code.css
    forms.css
    responsive.css
  styles.css             # 样式 import 入口
  storage.ts             # 当前 Supabase/localStorage 数据读写主文件
  types.ts               # 业务实体类型
  supabaseClient.ts      # Supabase client
```

## 功能模块说明

### Dashboard
展示进行中/达成目标、本日支出、本月支出、本日专注和单日最大专注。

### Goals
目标状态包括 `active`、`done`、`missed`。Supabase 配置存在时，目标以 Supabase `goals` 表为准，并清理本地 goals key。

### Calendar
日程保存到 `calendar_events`。前端仍保留 localStorage fallback，Supabase 可用时自动同步。

### Notes
三类笔记分别保存到：

- `idea_notes`
- `study_notes`
- `paste_notes`

学习笔记 answers 使用 jsonb；贴图笔记 HTML 保存到 `body_html`。

### Finance
保存到 `finance_entries`，本地 fallback key 不变。

### Code
代码片段保存到 `code_snippets`。支持保存、编辑、取消、删除。JavaScript 可以简易运行，其它语言用于学习展示。

## 数据保存方式

### localStorage

保留 fallback 和用户本地状态：

- `rinaspace-language`
- `rinaspace-notes-v1`
- `rinaspace-finance-v1`
- `rinaspace-code-snippets-v1`
- `rinaspace-calendar-events-v1`
- `rinaspace-focus-daily-v1`

注意：Supabase configured 时，`rinaspace-goals-v1` 会被清理，Goals 以 Supabase 为准。

### Supabase 表概要

- `goals`
  - title, category, due_date, notes, reward, reminder_preset_minutes, status, progress, reviews, created_at, updated_at
- `idea_notes`
  - title, body, created_at, updated_at
- `study_notes`
  - theme_id, title, answers, created_at, updated_at
- `paste_notes`
  - title, body_html, created_at, updated_at
- `finance_entries`
  - title, amount, kind, category, memo, entry_date, created_at, updated_at
- `calendar_events`
  - event_date, title, start_time, end_time, memo, created_at, updated_at
- `code_snippets`
  - title, language, code, notes, result, created_at, updated_at

SQL 文件在 `supabase/` 下，功能拆分文件包括 goals、finance、notes、calendar、code snippets。

## 开发注意点

- `5173` 和 `4173` 是不同 origin，localStorage 数据不共享。
- Supabase anon policy 当前允许匿名读写删，未来登录化后要按 user_id 做隔离。
- 不要修改现有 Supabase 表名和字段名，除非同时更新 storage 映射。
- 不要修改 localStorage key，除非写迁移逻辑。
- 当前 `src/app/App.tsx` 仍是主要组合文件，后续建议逐步将视图真实迁移到 `features/*`。

## 后续开发建议

1. 优先把 Notes 的 `NotesView`、`StudyNotesView`、`PasteNotesView` 真实抽到 `features/notes`。
2. 再抽 Calendar 的 `MonthCalendar` 和 `SchedulePanel`。
3. 再抽 Goals 的 `GoalsView`、`GoalCard`、`GoalDialog`。
4. 最后把 storage 按功能拆成 feature service，并保留 `src/storage.ts` 作为兼容聚合出口。
5. 给 Supabase 增加 `user_id` 和 auth 后，再收紧 RLS。

## 给未来 Codex / ChatGPT 的上下文

RinaSpace 是一个已接入 Supabase 的 React + TypeScript + Vite 单页应用。当前重构是低风险结构整理：样式已拆分，模块目录和类型/工具入口已建立，但大型视图仍主要在 `src/app/App.tsx` 中，后续应该按 Notes、Calendar、Goals 的顺序继续抽组件。功能和 UI 行为应保持稳定，任何重构都必须先跑 `npm.cmd run build`。
