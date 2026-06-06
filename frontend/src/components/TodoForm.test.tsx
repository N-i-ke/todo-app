import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';

import { resetState, state } from '../test/handlers';
import { renderWithProviders } from '../test/utils';

import TodoForm from './TodoForm';

describe('TodoForm', () => {
  beforeEach(() => {
    resetState();
  });

  it('submitting a non-empty title creates a todo via the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    const input = screen.getByPlaceholderText('新しいToDoを入力');
    await user.type(input, '  buy milk  ');
    await user.click(screen.getByRole('button', { name: /追加/ }));

    await waitFor(() => {
      expect(state.todos).toHaveLength(1);
    });
    // Title is trimmed before being sent.
    expect(state.todos[0].title).toBe('buy milk');
    expect(input).toHaveValue('');
  });

  it('submit button is disabled while the title is blank', () => {
    renderWithProviders(<TodoForm />);
    const button = screen.getByRole('button', { name: /追加/ });
    expect(button).toBeDisabled();
  });
});
