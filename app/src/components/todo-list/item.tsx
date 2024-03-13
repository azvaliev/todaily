import { CheckedState } from '@radix-ui/react-checkbox';
import {
  ChangeEvent, useContext, useEffect, useReducer, useRef,
} from 'react';
import { TodoManagerContext, TodoManagerContextValue } from '@/lib/todo-store/hooks';
import type { TodoOptionalId } from '@/lib/todo-store/hooks/constants';
import { TodoStatus, type Todo } from '@/lib/todo-store/types';
import { Button } from '@/components/ui/button';
import TrashIcon from '@/components/icons/trash-can';
import { Checkbox } from '@/components/ui/checkbox';

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
  const todoManagerCtx = useContext(TodoManagerContext);
  const todoIsEditable = typeof todo.id === 'string' && todoManagerCtx !== null;

  const {
    editableTodoProperties,
    handleTodoCompletedCheckChange,
    handleTodoContentInputEvent,
    handleDeleteTodo,
  } = useEditTodoListItem({ todo, todoManagerCtx });
  const todoIsComplete = editableTodoProperties.status === TodoStatus.Complete;

  return (
    <li
      className="flex items-center"
    >
      <Checkbox
        disabled={!todoIsEditable}
        checked={todoIsComplete}
        onCheckedChange={handleTodoCompletedCheckChange}
      />
      <input
        type="text"
        className={`ml-2 h-fit border-0 outline-none bg-transparent ${todoIsComplete && 'line-through brightness-50'}`}
        onChange={handleTodoContentInputEvent}
        disabled={!todoIsEditable}
        value={editableTodoProperties.content}
      />
      <Button
        className="ml-auto my-1 py-0"
        type="button"
        aria-label="Delete todo"
        disabled={!todoIsEditable}
        onClick={handleDeleteTodo}
      >
        <TrashIcon aria-hidden />
      </Button>
    </li>
  );
}

function useEditTodoListItem({ todo, todoManagerCtx } : { todo: TodoListItemProps['todo'], todoManagerCtx: TodoManagerContextValue }) {
  const [
    editableTodoProperties,
    updateEditableTodoProperties,
  ] = useReducer(handleUpdateEditableTodoProperties, {
    content: todo.content,
    status: todo.status,
  });
  const hasEditedTodo = useRef(false);

  const handleDeleteTodo = async () => {
    if (todoManagerCtx === null) return;
    if (!todo.id) return;

    const { mutateAsync } = todoManagerCtx.deleteTodoMutation;
    await mutateAsync(todo.id);
  };

  const handleTodoCompletedCheckChange = (checked: CheckedState) => {
    hasEditedTodo.current = true;
    updateEditableTodoProperties({
      status: checked === true ? TodoStatus.Complete : TodoStatus.Incomplete,
    });
  };

  const handleTodoContentInputEvent = (e: ChangeEvent<HTMLInputElement>) => {
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

  return {
    editableTodoProperties,
    handleTodoContentInputEvent,
    handleTodoCompletedCheckChange,
    handleDeleteTodo,
  };
}

export default TodoListItem;
