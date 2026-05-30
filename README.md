# ToDo App

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
npm install
npx prisma migrate dev --name init
npm run start:dev
```

API は `http://localhost:3000` で起動する。

### 3. フロントエンド

```sh
cd frontend
npm install
npm run dev
```

UI は `http://localhost:5173` で起動する。

## API

| Method | Path           | 説明                     |
| ------ | -------------- | ------------------------ |
| GET    | `/todos`       | 一覧取得                 |
| POST   | `/todos`       | 作成                     |
| PATCH  | `/todos/:id`   | 更新 (タイトル/完了状態) |
| DELETE | `/todos/:id`   | 削除                     |
