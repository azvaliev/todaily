import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import SearchIcon from '@/components/icons/search';
import TodoList from '@/components/todo-list';
import { TodoManagerContext, useTodoManager } from '@/lib/todo-store/hooks';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const today = useMemo(() => new Date(), []);

  /** Format date string based on locale */
  const numericDateString = today.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });

  const todoManager = useTodoManager(today);

  return (
    <TodoManagerContext.Provider value={todoManager}>
      <div className="w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 mx-auto">
        <div className="flex flex-row justify-between">
          <h1 className="text-primary text-3xl font-medium w-max">
            {numericDateString}
          </h1>
          <button type="button" aria-label="Search">
            <SearchIcon />
          </button>
        </div>
        <TodoList />
      </div>
    </TodoManagerContext.Provider>
  );
}
