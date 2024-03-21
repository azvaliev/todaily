import { TodoPriority } from '@/lib/todo-store/types';
import { cn } from '@/lib/utils';

type DisplayPriority = {
  color: string;
  name: string;
};

const todoPriorityToDisplayPriority = {
  [TodoPriority.Low]: {
    name: 'Low',
    color: '#fffbeb',
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

type PriorityIndicatorBlockProps = {
  priority: TodoPriority;
  // eslint-disable-next-line react/require-default-props
  className?: string;
};

function PriorityIndicatorBlock({
  priority,
  className,
}: PriorityIndicatorBlockProps): React.JSX.Element {
  const { color } = todoPriorityToDisplayPriority[priority]
    || todoPriorityToDisplayPriority[TodoPriority.Low];

  return (
    <span
      className={cn(
        'block w-1 h-full rounded-sm',
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}

export {
  type DisplayPriority,
  type PriorityIndicatorBlockProps,
  todoPriorityToDisplayPriority,
  PriorityIndicatorBlock,
};
