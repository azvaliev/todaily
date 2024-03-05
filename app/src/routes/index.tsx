import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import SearchIcon from '@/components/icons/search';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const today = useMemo(() => new Date(), []);

  /** Format date string based on locale */
  const numericDateString = today.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div>
      <div className="flex flex-row justify-around">
        <h1 className="text-primary text-3xl font-medium w-max">
          Daily -&nbsp;
          {numericDateString}
        </h1>
        <button type="button" aria-label="Search">
          <SearchIcon />
        </button>
      </div>

      <main>
        <ul>
          <li>Something</li>
          <li>Something Else</li>
        </ul>
      </main>
    </div>
  );
}
