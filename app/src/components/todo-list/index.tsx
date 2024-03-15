import React, { useContext } from 'react';
import { TodoManagerContext } from '@/lib/todo-store/hooks';
import TodoListItem from './item';
import AddTodoListItem from './add';

function Index(): React.JSX.Element | null {
  const todoManagerCtx = useContext(TodoManagerContext);

  // TODO: Loading skeletons
  if (!todoManagerCtx) return null;

  const {
    relevantTodosQuery: { data, error, isLoading },
  } = todoManagerCtx;

  // TODO: Loading skeletons
  if (!data || error || isLoading) return null;

  return (
    <main className="flex flex-col mx-auto">
      <ul className="list-disc list-inside text-lg leading-loose w-full py-12 flex flex-col gap-y-4">
        {data.items.length === 0 ? (
          <h2 className="font-extralight">No todos yet!</h2>
        ) : (
          data.items.map((item) => (
            <TodoListItem todo={item} key={`${item.id}-${item.createdAt}`} />
          ))
        )}
      </ul>
      <AddTodoListItem />
    </main>
  );
}

export default Index;
