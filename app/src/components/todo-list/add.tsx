import { FormEvent, useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Todo, TodoPriority, TodoStatus } from '@/lib/todo-store/types';
import { TodoManagerContext } from '@/lib/todo-store/hooks';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import { PriorityIndicatorBlock, todoPriorityToDisplayPriority } from '../priority';

const defaultNewTodo = { content: '', priority: TodoPriority.Normal };

function AddTodoListItem(): React.JSX.Element | null {
  const todoManagerCtx = useContext(TodoManagerContext);
  const [newTodo, setNewTodo] = useState<Pick<Todo, 'content' | 'priority'>>({ ...defaultNewTodo });

  if (!todoManagerCtx) return null;

  const { addTodoMutation: { mutateAsync } } = todoManagerCtx;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await mutateAsync({ ...newTodo, status: TodoStatus.Incomplete });
    setNewTodo({ ...defaultNewTodo });
  };

  return (
    <form className="flex flex-col w-full gap-y-4" onSubmit={handleSubmit}>
      <Textarea
        placeholder="What's next on the todo list?"
        value={newTodo.content}
        onChange={(e) => setNewTodo((prev) => ({ ...prev, content: e.target.value }))}
        required
        minLength={2}
      />
      <Select
        onValueChange={(val) => setNewTodo((prev) => ({ ...prev, priority: val as TodoPriority }))}
      >
        <SelectTrigger className="w-[180px] justify-start gap-x-2">
          <PriorityIndicatorBlock priority={newTodo.priority} />
          Priority:
          <SelectValue placeholder="Normal" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(todoPriorityToDisplayPriority)
            .map(([todoPriority, { name }]) => (
              <SelectItem value={todoPriority} key={todoPriority}>
                {name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
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
