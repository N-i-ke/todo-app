import { useState } from 'react';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import { useAuth } from '../contexts/AuthContext';
import { useTodos } from '../hooks/useTodos';
import type { TodoFilter } from '../types/todo';

const FILTERS: { label: string; value: TodoFilter }[] = [
  { label: 'すべて', value: 'all' },
  { label: '未完了', value: 'active' },
  { label: '完了済み', value: 'completed' },
];

export default function Home() {
  const [filter, setFilter] = useState<TodoFilter>('all');
  const todosQuery = useTodos();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  if (todosQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (todosQuery.isError) {
    const message = todosQuery.error instanceof Error ? todosQuery.error.message : '不明なエラー';
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-bold text-red-700">バックエンドに接続できません</h1>
          <p className="mb-2 text-sm text-gray-700">
            API サーバーが起動しているか確認してください。
          </p>
          <pre className="mb-4 overflow-x-auto rounded bg-gray-100 px-3 py-2 text-xs text-gray-700">
            {message}
          </pre>
          <button
            type="button"
            onClick={() => todosQuery.refetch()}
            disabled={todosQuery.isFetching}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {todosQuery.isFetching ? '再接続中...' : '再試行'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">ToDo</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              {loggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <TodoForm />
        </div>

        <div className="mb-4 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded px-3 py-1 text-sm ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <TodoList todos={todosQuery.data} filter={filter} />
      </div>
    </main>
  );
}
