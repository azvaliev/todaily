import React, { useEffect, useMemo, useState } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LocalTodoStore from '@/lib/todo-store/local-store';
import { TodoStoreContext, TodoStoreContextValue } from '@/lib/todo-store/hooks/constants.ts';

export const Route = createRootRoute({
  component: Root,
});

const queryClient = new QueryClient();

function Root(): React.JSX.Element {
  const [todoStore, setTodoStore] = useState<TodoStoreContextValue['store']>(null);

  useEffect(() => {
    async function getTodoStore() {
      const store = await LocalTodoStore.create();
      setTodoStore(store);
    }

    getTodoStore();
  }, []);

  const todoStoreContextValue = useMemo<TodoStoreContextValue>(() => ({
    store: todoStore,
  }), [todoStore]);

  return (
    <TodoStoreContext.Provider value={todoStoreContextValue}>
      <QueryClientProvider client={queryClient}>
        <div className="px-4 py-4">
          <Outlet />
          <TanStackRouterDevtools />
        </div>
      </QueryClientProvider>
    </TodoStoreContext.Provider>
  );
}
