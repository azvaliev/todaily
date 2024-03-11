import React, {
  ChangeEvent,
  FormEvent, useContext, useEffect, useReducer, useRef, useState,
} from 'react';
import { CheckedState } from '@radix-ui/react-checkbox';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { TodoMangerContext } from '@/lib/todo-store/hooks';
import { TodoOptionalId } from '@/lib/todo-store/hooks/constants.ts';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button';
import { Todo, TodoStatus } from '@/lib/todo-store/types.ts';

function Index(): React.JSX.Element | null {
  const todoManagerCtx = useContext(TodoMangerContext);

  // TODO: Loading skeletons
  if (!todoManagerCtx) return null;

  const {
    relevantTodosQuery: { data, error, isLoading },
  } = todoManagerCtx;

  // TODO: Loading skeletons
  if (!data || error || isLoading) return null;

  return (
    <main className="flex py-12 mx-auto">
      <ul className="list-disc list-inside text-lg leading-loose w-full">
        {data.items.map((item) => (
          <TodoListItem todo={item} key={`${item.id}-${item.createdAt}`} />
        ))}
        <AddTodoListItem />
      </ul>
    </main>
  );
}

type TodoListItemProps = {
  todo: TodoOptionalId,
};
type EditableTodoProperties = Pick<Todo, 'content' | 'status'>;
function handleUpdateEditableTodoProperties(
  prevState: EditableTodoProperties,
  newState: Partial<EditableTodoProperties>,
): EditableTodoProperties {
  return {
    ...prevState,
    ...newState,
  };
}

function TodoListItem({ todo }: TodoListItemProps): React.JSX.Element {
  const todoManagerCtx = useContext(TodoMangerContext);

  const todoIsEditable = typeof todo.id === 'string' && todoManagerCtx !== null;

  const [
    editableTodoProperties,
    updateEditableTodoProperties,
  ] = useReducer(handleUpdateEditableTodoProperties, {
    content: todo.content,
    status: todo.status,
  });
  const hasEditedTodo = useRef(false);

  const handleCheckedChange = (checked: CheckedState) => {
    hasEditedTodo.current = true;
    updateEditableTodoProperties({
      status: checked === true ? TodoStatus.Complete : TodoStatus.Incomplete,
    });
  };

  const handleInputEvent = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!value || value.length < 2) return;

    hasEditedTodo.current = true;
    updateEditableTodoProperties({
      content: value,
    });
  };

  useEffect(() => {
    const todoId = todo.id;
    if (!todoId) return;

    if (todoManagerCtx === null) return;

    if (!hasEditedTodo.current) return;

    const { updateTodoMutation: { mutateAsync: updateTodo } } = todoManagerCtx;
    const debounceTimeout = setTimeout(() => {
      updateTodo({ id: todoId, ...editableTodoProperties });
      hasEditedTodo.current = false;
    }, 300);

    // This is the only branch we create a timeout, so only place we need to close it
    // eslint-disable-next-line consistent-return
    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [editableTodoProperties, todoManagerCtx, todo.id]);

  useEffect(() => {
    updateEditableTodoProperties({
      content: todo.content,
      status: todo.status,
    });
  }, [todo.content, todo.status]);

  return (
    <li
      className="flex items-center"
    >
      <Checkbox
        disabled={!todoIsEditable}
        checked={editableTodoProperties.status === TodoStatus.Complete}
        onCheckedChange={handleCheckedChange}
      />
      <input
        type="text"
        className="ml-2 h-fit border-0 outline-none bg-transparent"
        onChange={handleInputEvent}
        disabled={!todoIsEditable}
        value={editableTodoProperties.content}
      />
    </li>
  );
}

function AddTodoListItem(): React.JSX.Element | null {
  const todoManagerCtx = useContext(TodoMangerContext);
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
