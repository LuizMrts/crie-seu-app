import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/components/auth-context";
import { EMPTY_WORKSPACE, type Resource } from "@/lib/business";
import { workspaceOptions } from "@/lib/workspace-data";

// Shared hook for private workspace pages: owns the workspace query, a loading
// window while auth resolves, and the "quick create" dialog flow used by the
// dashboard and each module page.
export function useWorkspace() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const enabled = Boolean(user);
  const query = useQuery({ ...workspaceOptions(user?.id ?? "anonymous"), enabled });
  // Give the auth listener one tick after sign-in before showing empty states.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setSettled(true), enabled ? 0 : 350);
      return () => clearTimeout(timer);
    }
  }, [loading, enabled]);

  const data = useMemo(
    () => (query.data ? query.data : query.isError ? undefined : enabled && query.isSuccess ? query.data : query.data ?? null),
    [query.data, query.isError, query.isSuccess, enabled],
  );

  function create(_resource: Resource) {
    void navigate({ to: _resource === 'clients' ? "/clientes" : _resource === 'quotes' ? "/orcamentos" : _resource === 'services' ? "/servicos" : "/financeiro", search: { novo: true } });
  }

  return {
    user,
    authLoading: loading,
    data: enabled ? (query.data ?? null) : null,
    workspace: enabled ? (query.data ?? EMPTY_WORKSPACE) : EMPTY_WORKSPACE,
    isLoading: loading || (enabled && query.isPending) || !settled,
    isError: query.isError,
    error: query.error,
    retry: () => void query.refetch(),
    invalidate: () => void queryClient.invalidateQueries({ queryKey: ["workspace"] }),
    create,
  };
}
