import {
  Link, createFileRoute, useNavigate, useSearch,
} from '@tanstack/react-router';
import TodoList from '@/components/todo-list';
import { TodoManagerContext, useTodoManager } from '@/lib/todo-store/hooks';
import StaleTodos from '@/components/stale-todos';
import Search from '@/components/search';
import { Button } from '@/components/ui/button';
import { formatDateYYYYMMDD } from '@/lib/date';
import { DatePickerHeader } from '@/components/date-picker-header';

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
  const today = new Date();
  const { date = today } = useSearch({ from: Route.fullPath });
  const navigate = useNavigate({ from: Route.fullPath });

  const todoManager = useTodoManager(date);

  const handleSetDate = (newDate: Date) => {
    // JavaScript doesn't have a simple way to get the date w/o time for comparison
    // So by converting to a date string that works
    const todayFmt = formatDateYYYYMMDD(today);
    const newDateFmt = formatDateYYYYMMDD(newDate);

    // Today is the default, so I don't want to push that as a special URL state
    if (todayFmt === newDateFmt) {
      navigate({ search: { date: undefined } });
    } else {
      navigate({ search: { date: newDate } });
    }
  };

  return (
    <TodoManagerContext.Provider value={todoManager}>
      <div className="w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 mx-auto">
        <div className="flex flex-row justify-between">
          <DatePickerHeader date={date} setDate={handleSetDate} />
          <Search />
        </div>
        {
          date.valueOf() !== today.valueOf() ? (
            <Button className="mt-4 text-sm" asChild>
              {/* This will create an href so it's okay */}
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <Link from="/">
                Return to Today &#8634;
              </Link>
            </Button>
          ) : null
        }
        <TodoList />
      </div>
      <StaleTodos />
    </TodoManagerContext.Provider>
  );
}
