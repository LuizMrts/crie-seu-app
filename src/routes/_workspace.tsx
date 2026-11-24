import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/workspace/shell";
import type { AuthState } from "@/routes/__root";

type RouteContext = { auth?: AuthState };

// Layout guard: every child route is private and renders inside the workspace shell.
export const Route = createFileRoute("/_workspace")({
  beforeLoad: ({ context }: { context: RouteContext }) => {
    if (context.auth?.loading) return;
    if (!context.auth?.user) throw redirect({ to: "/auth" });
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <WorkspaceShell>
      <Outlet />
    </WorkspaceShell>
  );
}

