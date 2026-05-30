import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../services/todoApi';
import type { CreateTodoInput, UpdateTodoInput } from '../types/todo';

const TODOS_KEY = ['todos'] as const;

export function useTodos() {
  return useQuery({
    queryKey: TODOS_KEY,
    queryFn: todoApi.list,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTodoInput }) =>
      todoApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => todoApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  });
}
