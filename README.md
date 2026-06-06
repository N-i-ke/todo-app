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

| コマンド             | 用途                          |
| -------------------- | ----------------------------- |
| `npm run start`      | 通常起動 (watch なし)         |
| `npm run build`      | 本番ビルド                    |
| `npm run start:prod` | ビルド済みファイルから起動    |
| `npm run lint`       | ESLint チェック               |
| `npm run lint:fix`   | ESLint で自動修正可能なものを修正 |
| `npm run format`     | Prettier で全ファイルを整形   |
| `npm run format:check` | Prettier の整形差分を確認 (CI と同じ) |
| `npm test`           | Jest unit tests               |
| `npm run test:watch` | Jest watch モード             |
| `npm run test:cov`   | Jest + カバレッジ             |
| `npm run test:e2e`   | Supertest + 実 PostgreSQL の E2E |

### フロントエンド (React + Vite)

```sh
cd frontend
npm run dev
```

- 起動 URL: `http://localhost:5173`
- HMR (ホットモジュールリロード) で変更が即時反映される
- API のエンドポイントを変更した場合は `frontend/.env` を確認する

その他のコマンド:

| コマンド            | 用途                              |
| ------------------- | --------------------------------- |
| `npm run build`     | 本番ビルド (型チェック込み)       |
| `npm run preview`   | ビルド成果物のプレビュー          |
| `npm run typecheck` | 型チェックのみ実行                |
| `npm run lint`     | ESLint チェック                   |
| `npm run lint:fix` | ESLint で自動修正可能なものを修正 |
| `npm run format`   | Prettier で全ファイルを整形       |
| `npm run format:check` | Prettier の整形差分を確認 (CI と同じ) |
| `npm test`         | Vitest run                        |
| `npm run test:watch` | Vitest watch モード             |
| `npm run test:cov` | Vitest + カバレッジ               |

### 停止方法

各ターミナルで `Ctrl + C` を押す。

## テスト

### Backend (Jest + Supertest)

- 単体テスト: `src/**/*.spec.ts` で Prisma を mock、サービスのロジックを検証
- E2E テスト: `test/*.e2e-spec.ts` で実 PostgreSQL に対して HTTP レベルで検証
  - 認証フロー (register / login / logout / me)
  - CSRF 強制 / SameSite=Strict cookie
  - ユーザー間データ分離 (Bob は Alice の Todo にアクセス不可)
  - ログインのタイミング攻撃耐性 (existing user vs ghost user)

E2E は実 DB を要するため、起動前に PostgreSQL が利用可能か `pg_isready -h localhost -p 5432` で確認。

### Frontend (Vitest + Testing Library + MSW)

- コンポーネントテスト: `src/components/**/*.test.tsx`
- HTTP クライアントテスト: `src/services/http.test.ts` (CSRF header の注入、401 ハンドラ等)
- MSW で API モック (`src/test/handlers.ts`)

## コーディング規約 / Lint・Format

- **Prettier**: ルートの `.prettierrc.json` を全プロジェクトで共有 (singleQuote / semi / trailingComma=all / printWidth=100)
- **ESLint**: backend / frontend それぞれに flat config (`eslint.config.mjs`) を設置
  - backend: `@typescript-eslint` typed rules + `import/order` (`no-floating-promises` を error)
  - frontend: React + react-hooks + react-refresh + jsx-a11y
  - 共通: `eslint-config-prettier` で Prettier と競合するルールを無効化
- **EditorConfig**: ルートに `.editorconfig` (LF / utf-8 / 2 space)
- CI で `npm run format:check` と `npm run lint` が実行され、違反があると失敗する

ローカルで一括整形する場合:

```sh
cd backend && npm run lint:fix && npm run format
cd ../frontend && npm run lint:fix && npm run format
```

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
