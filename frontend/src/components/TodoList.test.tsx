import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Todo } from '../types/todo';

import { renderWithProviders } from '../test/utils';

import TodoList from './TodoList';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  title: 'task',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('TodoList', () => {
  it('renders empty state when no todos match the filter', () => {
    renderWithProviders(<TodoList todos={[]} filter="all" />);
    expect(screen.getByText('表示できるToDoがありません')).toBeInTheDocument();
  });

  it('shows all todos when filter is "all"', () => {
    const todos = [
      makeTodo({ id: 1, title: 'a', completed: false }),
      makeTodo({ id: 2, title: 'b', completed: true }),
    ];
    renderWithProviders(<TodoList todos={todos} filter="all" />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  it('shows only incomplete todos when filter is "active"', () => {
    const todos = [
      makeTodo({ id: 1, title: 'a', completed: false }),
      makeTodo({ id: 2, title: 'b', completed: true }),
    ];
    renderWithProviders(<TodoList todos={todos} filter="active" />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.queryByText('b')).not.toBeInTheDocument();
  });

  it('shows only completed todos when filter is "completed"', () => {
    const todos = [
      makeTodo({ id: 1, title: 'a', completed: false }),
      makeTodo({ id: 2, title: 'b', completed: true }),
    ];
    renderWithProviders(<TodoList todos={todos} filter="completed" />);
    expect(screen.queryByText('a')).not.toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });
});
