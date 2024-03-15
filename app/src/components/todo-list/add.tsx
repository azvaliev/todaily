import { FormEvent, useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TodoStatus } from '@/lib/todo-store/types';
import { TodoManagerContext } from '@/lib/todo-store/hooks';

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

export default AddTodoListItem;
