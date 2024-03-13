import React, {
  FormEvent, useContext, useState,
} from 'react';
import { TodoManagerContext } from '@/lib/todo-store/hooks';
import { Button } from '@/components/ui/button';
import { TodoStatus } from '@/lib/todo-store/types.ts';
import TodoListItem from './item';
import { Textarea } from '@/components/ui/textarea';

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

function AddTodoListItem(): React.JSX.Element | null {
  const todoManagerCtx = useContext(TodoManagerContext);
  const [newTodo, setNewTodo] = useState('');

  if (!todoManagerCtx) return null;

  const { addTodoMutation: { mutateAsync } } = todoManagerCtx;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await mutateAsync({ content: newTodo, status: TodoStatus.Incomplete });
    setNewTodo('');
  };

  return (
    <form className="flex flex-col w-full gap-y-4" onSubmit={handleSubmit}>
      <Textarea
        placeholder="What's next on the todo list?"
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        required
        minLength={2}
      />
      <Button
        type="submit"
        className="w-full"
      >
        Add Todo
      </Button>
    </form>
  );
}

export default Index;
