import { http, HttpResponse } from 'msw';

import type { Todo } from '../types/todo';

const API_URL = 'http://localhost:3000';

type State = {
  user: { id: number; email: string } | null;
  todos: Todo[];
  nextId: number;
};

export const state: State = {
  user: null,
  todos: [],
  nextId: 1,
};

export function resetState(): void {
  state.user = null;
  state.todos = [];
  state.nextId = 1;
}

export const handlers = [
  http.get(`${API_URL}/auth/me`, () => {
    if (!state.user) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json(state.user);
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    state.user = { id: 1, email: body.email };
    return HttpResponse.json({ user: state.user });
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    state.user = { id: 1, email: body.email };
    return HttpResponse.json({ user: state.user }, { status: 201 });
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    state.user = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}/todos`, () => {
    return HttpResponse.json(state.todos);
  }),

  http.post(`${API_URL}/todos`, async ({ request }) => {
    const body = (await request.json()) as { title: string };
    const todo: Todo = {
      id: state.nextId++,
      title: body.title,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.todos.unshift(todo);
    return HttpResponse.json(todo, { status: 201 });
  }),

  http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Pick<Todo, 'title' | 'completed'>>;
    const id = Number(params.id);
    const todo = state.todos.find((t) => t.id === id);
    if (!todo) return new HttpResponse(null, { status: 404 });
    if (body.title !== undefined) todo.title = body.title;
    if (body.completed !== undefined) todo.completed = body.completed;
    todo.updatedAt = new Date().toISOString();
    return HttpResponse.json(todo);
  }),

  http.delete(`${API_URL}/todos/:id`, ({ params }) => {
    const id = Number(params.id);
    state.todos = state.todos.filter((t) => t.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
