# ToDo App

[![CI](https://github.com/N-i-ke/todo-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/N-i-ke/todo-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/N-i-ke/todo-app/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/N-i-ke/todo-app/actions/workflows/codeql.yml)

React + NestJS + PostgreSQL の学習用 ToDo アプリ。

## 構成

- `frontend/` — React + Vite + TypeScript + Tailwind + TanStack Query
- `backend/` — NestJS + Prisma + TypeScript
- PostgreSQL はローカルインストール (Homebrew 等) のものを利用

## 前提

- Node.js 18 以上
- npm
- PostgreSQL 14 以上 (ローカル起動済み)

## セットアップ

### 1. PostgreSQL の準備

macOS の場合、Homebrew でインストール・起動できる。

```sh
brew install postgresql@16
brew services start postgresql@16
```

DB とユーザーを作成する。

```sh
psql postgres <<'SQL'
CREATE ROLE todo WITH LOGIN PASSWORD 'todo';
CREATE DATABASE todo OWNER todo;
SQL
```

接続文字列を変えたい場合は `backend/.env` の `DATABASE_URL` を編集する。

### 2. バックエンド

```sh
cd backend
cp .env.example .env
# JWT_SECRET を 32 文字以上のランダム文字列に置き換える
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm install
npx prisma migrate dev
npm run start:dev
```

API は `http://localhost:3000` で起動する。

> ⚠️ `JWT_SECRET` が未設定または 32 文字未満の場合、バックエンドは起動時にエラーで停止する。

### 3. フロントエンド

```sh
cd frontend
npm install
npm run dev
```

UI は `http://localhost:5173` で起動する。

## 起動方法

初回セットアップ後、開発時は以下のコマンドで起動する。
バックエンドとフロントエンドはそれぞれ別ターミナルで実行すること。

### バックエンド (NestJS API)

```sh
cd backend
npm run start:dev
```

- 起動 URL: `http://localhost:3000`
- ファイル変更を監視して自動再起動する (watch モード)
- 事前に PostgreSQL が起動していること (`brew services start postgresql@16`)
- スキーマを変更した場合は `npx prisma migrate dev` を実行する

その他のコマンド:

| コマンド             | 用途                       |
| -------------------- | -------------------------- |
| `npm run start`      | 通常起動 (watch なし)      |
| `npm run build`      | 本番ビルド                 |
| `npm run start:prod` | ビルド済みファイルから起動 |

### フロントエンド (React + Vite)

```sh
cd frontend
npm run dev
```

- 起動 URL: `http://localhost:5173`
- HMR (ホットモジュールリロード) で変更が即時反映される
- API のエンドポイントを変更した場合は `frontend/.env` を確認する

その他のコマンド:

| コマンド            | 用途                       |
| ------------------- | -------------------------- |
| `npm run build`     | 本番ビルド (型チェック込み) |
| `npm run preview`   | ビルド成果物のプレビュー   |
| `npm run typecheck` | 型チェックのみ実行         |

### 停止方法

各ターミナルで `Ctrl + C` を押す。

## 認証

JWT (HS256) を httpOnly Cookie に格納し、SameSite=Strict + CSRF Double-submit Cookie で保護する。

- `access_token` Cookie: httpOnly。フロントから直接読めない。
- `csrf_token` Cookie: JavaScript から読める。`X-CSRF-Token` ヘッダにコピーして送信する。
- パスワードは bcrypt (saltRounds=12) でハッシュ化。
- ログイン失敗は user 有無に関わらず `Invalid email or password` を返す。
- `/auth/login` は 5 回/15 分、`/auth/register` は 3 回/時の Rate Limit。

### 必要な環境変数

| Key | 必須 | 説明 |
| --- | ---- | ---- |
| `DATABASE_URL` | ✓ | PostgreSQL 接続文字列 |
| `JWT_SECRET` | ✓ | JWT 署名鍵。**32 文字以上必須** |
| `JWT_EXPIRES_IN` | | デフォルト `1d` |
| `CORS_ORIGINS` | | カンマ区切り。デフォルト `http://localhost:5173` |
| `JWT_COOKIE_MAX_AGE_MS` | | Cookie の MaxAge (ms)。デフォルト `86400000` (1 日) |
| `PORT` | | デフォルト `3000` |

## API

| Method | Path             | 認証 | 説明                                |
| ------ | ---------------- | ---- | ----------------------------------- |
| POST   | `/auth/register` | ×    | `{email, password}` → ユーザー作成 |
| POST   | `/auth/login`    | ×    | `{email, password}` → ログイン     |
| POST   | `/auth/logout`   | ✓    | Cookie をクリア                     |
| GET    | `/auth/me`       | ✓    | 現在のユーザー情報                  |
| GET    | `/todos`         | ✓    | 一覧取得 (自分の ToDo のみ)         |
| POST   | `/todos`         | ✓    | 作成                                |
| PATCH  | `/todos/:id`     | ✓    | 更新 (タイトル/完了状態)            |
| DELETE | `/todos/:id`     | ✓    | 削除                                |

認証が必要なエンドポイントは `access_token` Cookie に加え、状態変更系 (POST/PATCH/DELETE) は `X-CSRF-Token` ヘッダが必須。
