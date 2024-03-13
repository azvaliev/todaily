import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { ULID } from 'ulidx';
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

  type MutationContext = { existingTodos: TodoListOptionalId | undefined };

  /**
    * All the mutation optimistic updates have
    * some boilerplate around canceling the old query, get the existing data
    * and populate context with the existing data to rollback optimistic update if needed
    * */
  const handleOptimisticMutationFactory = <TInput>(
    getOptimisticData: (existingItems: TodoListOptionalId['items'], input: TInput) => TodoListOptionalId,
  ): (input: TInput) => Promise<MutationContext> => {
    const fn = async (input: TInput) => {
      await queryClient.cancelQueries({ queryKey: relevantTodosQueryKey });

      const existingTodos = queryClient.getQueryData<TodoListOptionalId>(relevantTodosQueryKey);
      queryClient.setQueryData<TodoListOptionalId>(
        relevantTodosQueryKey,
        (existingData) => {
          const { items = [] } = existingData ?? {};

          return getOptimisticData(items, input);
        },
      );

      return { existingTodos };
    };

    return fn;
  };

  const handleMutationError = (
    _err: unknown,
    _input: unknown,
    context: MutationContext | undefined,
  ) => {
    queryClient.setQueryData(relevantTodosQueryKey, context?.existingTodos);
  };

  const handleMutationSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: [QUERY_CACHE_PREFIX_KEY],
    });
  };

  const handleOptimisticAddTodo = handleOptimisticMutationFactory<CreateTodoInput>(
    (existingItems, input) => {
      const newItems = [
        ...existingItems,
        {
          status: TodoStatus.Incomplete,
          createdAt: new Date(),
          ...input,
        },
      ];

      return {
        items: newItems,
      };
    },
  );

  const addTodoMutation = useMutation({
    mutationFn(...params: Parameters<TodoStore['createTodo']>) {
      if (!store) {
        throw new Error('todo store not initialized, cannot add todo');
      }

      return store.createTodo(...params);
    },
    onMutate: handleOptimisticAddTodo,
    onError: handleMutationError,
    onSuccess: handleMutationSuccess,
  });

  const handleOptimisticUpdateTodo = handleOptimisticMutationFactory<UpdateTodoInputDetails>(
    (existingItems, input) => {
      const itemToUpdateIdx = existingItems.findIndex((item) => (
        item.id === input.id
      ));

      if (itemToUpdateIdx !== -1) {
        const existingItem = existingItems[itemToUpdateIdx]!;

        // eslint-disable-next-line no-param-reassign
        existingItems[itemToUpdateIdx] = {
          ...existingItem,
          ...input,
        };
      }

      return {
        items: existingItems,
      };
    },
  );

  const updateTodoMutation = useMutation({
    mutationFn(...params: Parameters<TodoStore['updateTodo']>) {
      if (!store) {
        throw new Error('todo store not initialized, cannot add todo');
      }

      return store.updateTodo(...params);
    },
    onMutate: handleOptimisticUpdateTodo,
    onError: handleMutationError,
    onSuccess: handleMutationSuccess,
  });

  const handleOptimisticDeleteTodo = handleOptimisticMutationFactory<ULID>(
    (existingItems, todoId) => {
      const itemToDeleteIdx = existingItems.findIndex((item) => (
        item.id === todoId
      ));

      if (itemToDeleteIdx !== -1) {
        existingItems.splice(itemToDeleteIdx, 1);
      }

      return {
        items: existingItems,
      };
    },
  );

  const deleteTodoMutation = useMutation({
    mutationFn(...params: Parameters<TodoStore['deleteTodo']>) {
      if (!store) {
        throw new Error('todo store not initialized, cannot add todo');
      }

      return store.deleteTodo(...params);
    },
    onMutate: handleOptimisticDeleteTodo,
    onError: handleMutationError,
    onSuccess: handleMutationSuccess,
  });

  return {
    addTodoMutation,
    updateTodoMutation,
    deleteTodoMutation,
  };
}

export { useTodoMutation };
