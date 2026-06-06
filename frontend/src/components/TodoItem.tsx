import { useState } from 'react';
import { useDeleteTodo, useUpdateTodo } from '../hooks/useTodos';
import type { Todo } from '../types/todo';

type Props = {
  todo: Todo;
};

export default function TodoItem({ todo }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const toggleCompleted = () => {
    updateTodo.mutate({ id: todo.id, input: { completed: !todo.completed } });
  };

  const startEdit = () => {
    setDraft(todo.title);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(todo.title);
    setIsEditing(false);
  };

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === todo.title) {
      cancelEdit();
      return;
    }
    updateTodo.mutate(
      { id: todo.id, input: { title: trimmed } },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  return (
    <li className="flex items-center gap-3 rounded border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggleCompleted}
        disabled={updateTodo.isPending}
        className="h-5 w-5 cursor-pointer accent-blue-600"
      />

      {isEditing ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          // The input is only rendered when the user explicitly enters
          // edit mode; focusing it immediately mirrors the intent.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          maxLength={200}
          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <span
          className={`flex-1 ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
          onDoubleClick={startEdit}
        >
          {todo.title}
        </span>
      )}

      {isEditing ? (
        <>
          <button
            type="button"
            onClick={saveEdit}
            disabled={updateTodo.isPending}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            保存
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={startEdit}
            className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => deleteTodo.mutate(todo.id)}
            disabled={deleteTodo.isPending}
            className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:bg-gray-400"
          >
            削除
          </button>
        </>
      )}
    </li>
  );
}
