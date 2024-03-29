import { createContext, useContext } from 'react';
import {
  skipToken,
  useQuery,
} from '@tanstack/react-query';
import { useTodoMutation } from '@/lib/todo-store/hooks/mutation.ts';
import { QUERY_CACHE_PREFIX_KEY, TodoListOptionalId, TodoStoreContext } from '@/lib/todo-store/hooks/constants.ts';

function useTodoManager(date: Date) {
  const { store } = useContext(TodoStoreContext);

  const storeInstantiated = store !== null;

  const relevantTodosQueryKey = [QUERY_CACHE_PREFIX_KEY, 'relevant', date.toLocaleDateString(), storeInstantiated] as const;
  const relevantTodosQuery = useQuery<TodoListOptionalId | undefined>({
    queryKey: relevantTodosQueryKey,
    queryFn: storeInstantiated ? () => (
      store!.getRelevantTodos(date)
    ) : skipToken,
  });

  const {
    addTodoMutation,
    updateTodoMutation,
    deleteTodoMutation,
  } = useTodoMutation({ store, relevantTodosQueryKey });

  return {
    relevantTodosQuery,
    addTodoMutation,
    updateTodoMutation,
    deleteTodoMutation,
  };
}

const TodoManagerContext = createContext<TodoManagerContextValue>(null);
type TodoManagerContextValue = ReturnType<typeof useTodoManager> | null;

export {
  useTodoManager,
  TodoManagerContext,
  type TodoManagerContextValue,
};
