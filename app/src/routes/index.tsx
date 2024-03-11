import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import SearchIcon from '@/components/icons/search';
import TodoList from '@/components/todo-list';
import { TodoMangerContext, useTodoManager } from '@/lib/todo-store/hooks';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const today = useMemo(() => new Date(), []);

  /** Format date string based on locale */
  const numericDateString = today.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });

  const todoManager = useTodoManager(today);

  return (
    <TodoMangerContext.Provider value={todoManager}>
      <div className="px-72">
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
    </TodoMangerContext.Provider>
  );
}
