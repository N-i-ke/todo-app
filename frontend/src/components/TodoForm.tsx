import { useState, type FormEvent } from 'react';
import { useCreateTodo } from '../hooks/useTodos';

export default function TodoForm() {
  const [title, setTitle] = useState('');
  const createTodo = useCreateTodo();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTodo.mutate(
      { title: trimmed },
      {
        onSuccess: () => setTitle(''),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="新しいToDoを入力"
        maxLength={200}
        className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={createTodo.isPending || !title.trim()}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {createTodo.isPending ? '追加中...' : '追加'}
      </button>
    </form>
  );
}
