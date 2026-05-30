import type { Todo, TodoFilter } from '../types/todo';
import TodoItem from './TodoItem';

type Props = {
  todos: Todo[];
  filter: TodoFilter;
};

function applyFilter(todos: Todo[], filter: TodoFilter): Todo[] {
  if (filter === 'active') return todos.filter((t) => !t.completed);
  if (filter === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

export default function TodoList({ todos, filter }: Props) {
  const visible = applyFilter(todos, filter);

  if (visible.length === 0) {
    return (
      <p className="rounded border border-dashed border-gray-300 py-8 text-center text-gray-500">
        表示できるToDoがありません
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {visible.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
