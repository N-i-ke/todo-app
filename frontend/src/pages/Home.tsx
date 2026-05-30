import { useState } from 'react';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import { useTodos } from '../hooks/useTodos';
import type { TodoFilter } from '../types/todo';

const FILTERS: { label: string; value: TodoFilter }[] = [
  { label: 'すべて', value: 'all' },
  { label: '未完了', value: 'active' },
  { label: '完了済み', value: 'completed' },
];

export default function Home() {
  const [filter, setFilter] = useState<TodoFilter>('all');
  const { data: todos, isLoading, isError, error } = useTodos();

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-2xl px-4">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">ToDo</h1>

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

        {isLoading && <p className="text-gray-500">読み込み中...</p>}
        {isError && (
          <p className="rounded bg-red-50 p-3 text-red-700">
            読み込みに失敗しました: {error instanceof Error ? error.message : '不明なエラー'}
          </p>
        )}
        {todos && <TodoList todos={todos} filter={filter} />}
      </div>
    </main>
  );
}
