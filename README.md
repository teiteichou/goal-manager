# RinaSpace

React + TypeScript + Supabase 版の目標管理 App です。

## 開発

```bash
npm install
npm run dev
```

現在の開発 URL:

```text
http://127.0.0.1:4173/
```

## Supabase

`.env.example` を参考に `.env` を作成します。

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase が未設定の場合、アプリはブラウザの localStorage に保存します。
Supabase が設定されている場合は `goals` テーブルに目標を同期します。
Notes、Finance、Code は現在 localStorage を使用し、Supabase 用の `notes` / `finance_entries` / `code_snippets` テーブル定義も用意しています。
Notes はアイデア記録の付箋表示と、テーマ別学習ノートテンプレートに対応しています。

テーブル作成 SQL は [supabase/schema.sql](/D:/myProjects/supabase/schema.sql) にあります。
