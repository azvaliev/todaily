import { FormEvent, useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Todo, TodoPriority, TodoStatus } from '@/lib/todo-store/types';
import { TodoManagerContext } from '@/lib/todo-store/hooks';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';

type DisplayPriority = {
  color: string;
  name: string;
};

const todoPriorityToDisplayPriority = {
  [TodoPriority.Low]: {
    name: 'Low',
    color: '#2563eb',
  },
  [TodoPriority.Normal]: {
    name: 'Normal',
    color: '#fb923c',
  },
  [TodoPriority.High]: {
    name: 'High',
    color: '#dc2626',
  },
} satisfies { [K in TodoPriority]: DisplayPriority };

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

  const { color: activeTodoPriorityColor } = todoPriorityToDisplayPriority[newTodo.priority]
    || todoPriorityToDisplayPriority[TodoPriority.Low];

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
          <span
            className="block w-1 h-full"
            style={{ backgroundColor: activeTodoPriorityColor }}
          />
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
