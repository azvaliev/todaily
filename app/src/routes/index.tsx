import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import TodoList from '@/components/todo-list';
import { TodoManagerContext, useTodoManager } from '@/lib/todo-store/hooks';
import StaleTodos from '@/components/stale-todos';
import Search from '@/components/search';

export const Route = createFileRoute('/')({
  component: Index,
  validateSearch(search: Record<string, unknown>) {
    let date: Date | undefined;

    if ('date' in search && typeof search.date === 'string') {
      const tryDate = new Date(search.date);

      // If the date string was invalid, the date.valueOf will be NaN
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#return_value
      if (!Number.isNaN(tryDate.valueOf())) {
        date = tryDate;
      }
    }

    return {
      date,
    };
  },
});

function Index() {
  const today = useMemo(() => new Date(), []);
  const { date = today } = useSearch({ from: Route.fullPath });

  /** Format date string based on locale */
  const numericDateString = date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });

  const todoManager = useTodoManager(date);

  return (
    <TodoManagerContext.Provider value={todoManager}>
      <div className="w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 mx-auto">
        <div className="flex flex-row justify-between">
          <h1 className="text-primary text-3xl font-medium w-max">
            {numericDateString}
          </h1>
          <Search />
        </div>
        <TodoList />
      </div>
      <StaleTodos />
    </TodoManagerContext.Provider>
  );
}
