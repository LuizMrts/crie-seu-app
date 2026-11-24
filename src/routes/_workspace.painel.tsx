import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/workspace/dashboard";
import { EMPTY_WORKSPACE } from "@/lib/business";
import { useWorkspace } from "@/lib/workspace-hooks";

export const Route = createFileRoute("/_workspace/painel")({
  component: PainelPage,
});

function PainelPage() {
  const { data, user, create } = useWorkspace();
  return (
    <Dashboard
      data={data ?? EMPTY_WORKSPACE}
      onCreate={create}
      signedIn={Boolean(user)}
    />
  );
}
