import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <div className="px-4 py-4">
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
});
