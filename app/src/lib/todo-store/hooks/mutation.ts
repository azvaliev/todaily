import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateTodoInput, TodoStatus, TodoStore, UpdateTodoInputDetails,
} from '@/lib/todo-store/types.ts';
import { QUERY_CACHE_PREFIX_KEY, TodoListOptionalId } from '@/lib/todo-store/hooks/constants.ts';

type UseTodoMutationParams = {
  store: TodoStore | null;
  relevantTodosQueryKey: QueryKey;
};

function useTodoMutation({ store, relevantTodosQueryKey }: UseTodoMutationParams) {
  const queryClient = useQueryClient();

  const handleOptimisticAddTodo = async (details: CreateTodoInput) => {
    await queryClient.cancelQueries({ queryKey: relevantTodosQueryKey });

    const existingTodos = queryClient.getQueryData<TodoListOptionalId>(relevantTodosQueryKey);
    queryClient.setQueryData<TodoListOptionalId>(
      relevantTodosQueryKey,
      (existingData) => {
        const { items = [] } = existingData ?? {};

        const newItems = [
          ...items,
          {
            status: TodoStatus.Incomplete,
            createdAt: new Date(),
            ...details,
          },
        ];

        return {
          items: newItems,
        };
      },
    );

    return { existingTodos };
  };

  const addTodoMutation = useMutation({
    mutationFn(...params: Parameters<TodoStore['createTodo']>) {
      if (!store) {
        throw new Error('todo store not initialized, cannot add todo');
      }

      return store.createTodo(...params);
    },
    onMutate: handleOptimisticAddTodo,
    onError(_err, _newTodoInput, context) {
      queryClient.setQueryData(relevantTodosQueryKey, context?.existingTodos);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_CACHE_PREFIX_KEY],
      });
    },
  });

  const handleOptimisticUpdateTodo = async (updateDetails: UpdateTodoInputDetails) => {
    await queryClient.cancelQueries({ queryKey: relevantTodosQueryKey });

    const existingTodos = queryClient.getQueryData<TodoListOptionalId>(relevantTodosQueryKey);
    queryClient.setQueryData<TodoListOptionalId>(
      relevantTodosQueryKey,
      (existingData) => {
        const { items = [] } = existingData ?? {};

        const itemToUpdateIdx = items.findIndex((item) => (
          item.id === updateDetails.id
        ));

        if (itemToUpdateIdx !== -1) {
          const existingItem = items[itemToUpdateIdx]!;

          items[itemToUpdateIdx] = {
            ...existingItem,
            ...updateDetails,
          };
        }

        return {
          items,
        };
      },
    );

    return { existingTodos };
  };

  const updateTodoMutation = useMutation({
    mutationFn(...params: Parameters<TodoStore['updateTodo']>) {
      if (!store) {
        throw new Error('todo store not initialized, cannot add todo');
      }

      return store.updateTodo(...params);
    },
    onMutate: handleOptimisticUpdateTodo,
    onError(_err, _newTodoInput, context) {
      queryClient.setQueryData(relevantTodosQueryKey, context?.existingTodos);
    },
    onSuccess() {
      return queryClient.invalidateQueries({
        queryKey: [QUERY_CACHE_PREFIX_KEY],
      });
    },
  });

  return {
    addTodoMutation,
    updateTodoMutation,
  };
}

export { useTodoMutation };
