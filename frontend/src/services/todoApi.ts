import type { CreateTodoInput, Todo, UpdateTodoInput } from '../types/todo';
import { http } from './http';

export const todoApi = {
  list: () => http<Todo[]>('/todos'),

  create: (input: CreateTodoInput) =>
    http<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateTodoInput) =>
    http<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    http<void>(`/todos/${id}`, {
      method: 'DELETE',
    }),
};
