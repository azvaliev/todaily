import React, {
  FormEvent, useContext, useState,
} from 'react';
import { TodoManagerContext } from '@/lib/todo-store/hooks';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button';
import { TodoStatus } from '@/lib/todo-store/types.ts';
import TodoListItem from './item';

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
      <ul className="list-disc list-inside text-lg leading-loose w-full py-12">
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
    <form className="flex w-full max-w-sm items-center space-x-2" onSubmit={handleSubmit}>
      <Input
        type="text"
        placeholder="What's next on the todo list?"
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        size={newTodo.length}
        required
        minLength={2}
      />
      <Button type="submit">
        Add
      </Button>
    </form>
  );
}

export default Index;
