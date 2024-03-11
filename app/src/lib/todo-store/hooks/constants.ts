import { createContext } from 'react';
import { Todo, TodoStore } from '@/lib/todo-store/types.ts';

type TodoStoreContextValue = { store: TodoStore | null };
const TodoStoreContext = createContext<TodoStoreContextValue>({
  store: null,
});

/**
 * All query keys should start with this, so we can invalidate them easily when new todos are added
 */
const QUERY_CACHE_PREFIX_KEY = 'todos';

/**
 * Make the ID optional because we have optimistic updates
 */
type TodoListOptionalId = {
  items: TodoOptionalId[]
};

type TodoOptionalId = PartialByKeys<Todo, 'id'>;

type MergeIntersection<T> = {
  [P in keyof T]: T[P];
};
type PartialByKeys<
  T,
  K extends keyof T = keyof T,
> = MergeIntersection<{
  [P in keyof T as P extends K ? P : never]?: T[P]
} & {
  [P in keyof T as P extends K ? never : P]: T[P]
}>;

export {
  type TodoStoreContextValue,
  type TodoOptionalId,
  type TodoListOptionalId,
  TodoStoreContext,
  QUERY_CACHE_PREFIX_KEY,
};
