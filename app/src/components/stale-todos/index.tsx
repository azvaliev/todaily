import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '../ui/drawer';
import LoadingSpinnerIcon from '../icons/loading';
import { Button } from '../ui/button';
import { useStaleTodos } from './hook';
import StaleTodoItem from './item';

/**
 * If there are any stale todos, display a popup to handle them
 * */
function StaleTodos(): React.JSX.Element | null {
  const {
    staleTodosWithAction,
    updateStaleTodosWithAction,
    staleTodosLoading,
    handleStaleTodoActions,
    handleStaleTodoActionsStatus,
  } = useStaleTodos();

  const noStaleTodos = staleTodosWithAction.length === 0;

  if (staleTodosLoading || noStaleTodos) {
    return null;
  }

  if (handleStaleTodoActionsStatus === 'pending') {
    return (
      <Drawer open>
        <DrawerContent>
          <LoadingSpinnerIcon
            className="mx-auto my-8"
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open>
      <DrawerContent className="outline-none flex items-center pb-6">
        <DrawerHeader className="pt-6">
          <DrawerTitle className="text-2xl font-medium text-center">
            Some previous todos were not completed
          </DrawerTitle>
          <h3 className="w-2/3 mx-auto pt-2 text-center font-extralight">
            Anything that is not deleted or marked as completed will be carried over to today
          </h3>
        </DrawerHeader>
        <ul className="py-6">
          {staleTodosWithAction.map((t) => (
            <StaleTodoItem
              key={t.id}
              staleTodoWithAction={t}
              updateStaleTodosWithActions={updateStaleTodosWithAction}
            />
          ))}
        </ul>
        <Button
          className="w-fit px-4 text-lg"
          onClick={() => handleStaleTodoActions(staleTodosWithAction)}
        >
          Done
        </Button>
      </DrawerContent>
    </Drawer>
  );
}

export default StaleTodos;
