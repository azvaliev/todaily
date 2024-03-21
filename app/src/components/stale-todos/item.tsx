import type { Dispatch } from 'react';
import { CheckedState } from '@radix-ui/react-checkbox';
import type { StaleTodoWithAction, UpdateStaleTodoWithActionsInput } from './hook';
import { StaleTodoAction } from '@/lib/todo-store/types';
import { Button } from '@/components/ui/button';
import TrashIcon from '@/components/icons/trash-can';
import { Checkbox } from '../ui/checkbox';
import { PriorityIndicatorBlock } from '../priority';

type StaleTodoItemProps = {
  staleTodoWithAction: StaleTodoWithAction;
  updateStaleTodosWithActions: Dispatch<UpdateStaleTodoWithActionsInput>;
};

function StaleTodoItem({
  staleTodoWithAction,
  updateStaleTodosWithActions,
}: StaleTodoItemProps): React.JSX.Element {
  const { id: todoId, action, content } = staleTodoWithAction;

  const handleDeleteStaleTodo = () => {
    updateStaleTodosWithActions({
      type: 'update',
      data: { id: todoId, action: StaleTodoAction.MarkInactive },
    });
  };

  const handleCompletedStaleTodo = (checkedState: CheckedState) => {
    const newAction = checkedState === true
      ? StaleTodoAction.MarkCompleted
      : StaleTodoAction.CarryOver;

    updateStaleTodosWithActions({
      type: 'update',
      data: {
        id: todoId,
        action: newAction,
      },
    });
  };

  const todoQueudForDeletion = action === StaleTodoAction.MarkInactive;
  const todoShouldBeCrossed = [
    StaleTodoAction.MarkCompleted,
    StaleTodoAction.MarkInactive,
  ].includes(action);

  return (
    <li className="flex flex-row items-center">
      <PriorityIndicatorBlock
        priority={staleTodoWithAction.priority}
        className="mr-2 h-8 w-[6px]"
      />
      <Checkbox
        checked={action === StaleTodoAction.MarkCompleted}
        disabled={todoQueudForDeletion}
        onCheckedChange={handleCompletedStaleTodo}
      />
      <span
        className={
          `block text-md mx-4 w-full 
          ${todoShouldBeCrossed ? 'line-through brightness-50' : ''}`
        }
      >
        {content}
      </span>
      <Button
        className="my-1 py-0"
        type="button"
        aria-label="Delete todo"
        onClick={handleDeleteStaleTodo}
        disabled={todoQueudForDeletion}
      >
        <TrashIcon aria-hidden />
      </Button>
    </li>
  );
}

export default StaleTodoItem;
