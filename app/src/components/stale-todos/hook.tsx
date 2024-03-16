import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { QUERY_CACHE_PREFIX_KEY, TodoStoreContext } from '@/lib/todo-store/hooks/constants';
import { HandleStaleTodoInput, StaleTodoAction, Todo } from '@/lib/todo-store/types';

export type StaleTodoWithAction = HandleStaleTodoInput & Pick<Todo, 'content'>;

function useStaleTodos() {
  const {
    staleTodos,
    ...mutationInfo
  } = useStaleTodoMutations();

  const [
    staleTodosWithAction,
    updateStaleTodosWithAction,
  ] = useReducer(handleUpdateStaleTodosWithActions, []);

  // When we load the stale todos, let's display them with a default action to carry over
  useEffect(() => {
    if (!staleTodos) return;

    const defaultTodosWithActions = staleTodos.items.map(({ content, id }) => {
      const todoAction = {
        id,
        content,
        action: StaleTodoAction.CarryOver,
      };

      return todoAction;
    });

    updateStaleTodosWithAction({
      type: 'set',
      data: defaultTodosWithActions,
    });
  }, [staleTodos]);

  return {
    ...mutationInfo,
    staleTodosWithAction,
    updateStaleTodosWithAction,
  };
}

export type UpdateStaleTodoWithActionsInput = {
  type: 'update';
  data: HandleStaleTodoInput;
} | {
  type: 'set';
  data: StaleTodoWithAction[];
};

function handleUpdateStaleTodosWithActions(
  prevState: StaleTodoWithAction[],
  input: UpdateStaleTodoWithActionsInput,
) {
  if (input.type === 'set') {
    return input.data;
  }

  const { id: idToUpdate, action: newAction } = input.data;
  const newState = prevState
    .map(({ id: todoId, action, ...rest }) => {
      const isActionToUpdate = todoId === idToUpdate;

      if (!isActionToUpdate) {
        return { id: todoId, action, ...rest };
      }

      return {
        ...rest,
        id: todoId,
        action: newAction,
      };
    });

  return newState;
}

function useStaleTodoMutations() {
  const { store } = useContext(TodoStoreContext);
  const queryClient = useQueryClient();

  const staleTodosQueryKey = useMemo(() => [QUERY_CACHE_PREFIX_KEY, 'stale', new Date().getDate()] as const, []);
  const { data: staleTodos, isLoading: staleTodosLoading } = useQuery({
    queryKey: staleTodosQueryKey,
    async queryFn() {
      if (!store) {
        return;
      }

      // eslint-disable-next-line consistent-return
      return store.getStaleTodos();
    },
    enabled: !!store,
  });

  const {
    mutateAsync: handleStaleTodoActions,
    status: handleStaleTodoActionsStatus,
    error: handleStaleTodoActionsError,
  } = useMutation({
    async mutationFn(input: HandleStaleTodoInput[]) {
      if (!store) return;

      await store.handleStaleTodosActions(input);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERY_CACHE_PREFIX_KEY] });
      queryClient.setQueryData(staleTodosQueryKey, { items: [] });
    },
  });

  return {
    staleTodos,
    staleTodosLoading,
    handleStaleTodoActions,
    handleStaleTodoActionsStatus,
    handleStaleTodoActionsError,
  };
}

export { useStaleTodos };
