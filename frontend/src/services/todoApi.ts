import type { CreateTodoInput, Todo, UpdateTodoInput } from '../types/todo';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const todoApi = {
  list: () => request<Todo[]>('/todos'),

  create: (input: CreateTodoInput) =>
    request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateTodoInput) =>
    request<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    request<void>(`/todos/${id}`, {
      method: 'DELETE',
    }),
};
