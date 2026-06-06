import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetState, state } from '../test/handlers';
import { renderWithProviders } from '../test/utils';
import type { Todo } from '../types/todo';

import TodoItem from './TodoItem';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  title: 'buy milk',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('TodoItem', () => {
  beforeEach(() => {
    resetState();
    // Seed an item so PATCH/DELETE handlers find it.
    state.todos.push(makeTodo());
  });

  it('toggles completed state via the checkbox', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoItem todo={makeTodo({ completed: false })} />);

    await user.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(state.todos[0].completed).toBe(true);
    });
  });

  it('clicking 編集 then 保存 updates the title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoItem todo={makeTodo()} />);

    await user.click(screen.getByRole('button', { name: '編集' }));
    const input = screen.getByDisplayValue('buy milk');
    await user.clear(input);
    await user.type(input, 'buy bread');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(state.todos[0].title).toBe('buy bread');
    });
  });

  it('clicking 削除 issues a DELETE request', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoItem todo={makeTodo()} />);

    await user.click(screen.getByRole('button', { name: '削除' }));

    await waitFor(() => {
      expect(state.todos).toHaveLength(0);
    });
  });
});
