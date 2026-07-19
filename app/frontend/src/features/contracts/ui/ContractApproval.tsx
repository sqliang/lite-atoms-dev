/** Approved Build Contract gate for the initial Run; Builder cannot start before this action. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/shared/api/client';

interface Contract {
  id: string;
  version: number;
  status: 'draft' | 'approved' | 'superseded';
  content_json: { title?: string; summary?: string; features?: string[] };
}

/** Poll for Planner output and allow the owner to release Builder for the same initial Run. */
export function ContractApproval({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const contracts = useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => apiRequest<Contract[]>(`/v1/projects/${projectId}/contracts`),
    refetchInterval: (query) => query.state.data?.some((item) => item.status === 'draft') ? false : 1_000,
  });
  const approve = useMutation({
    mutationFn: (contractId: string) => apiRequest(`/v1/projects/${projectId}/contracts/${contractId}/approve`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts', projectId] }),
  });
  const draft = contracts.data?.find((contract) => contract.status === 'draft');
  if (!draft) return null;
  return (
    <section className="absolute z-10 top-3 right-3 max-w-sm rounded-lg border bg-background/95 p-3 shadow-lg">
      <p className="text-xs font-semibold">Build Contract v{draft.version}: {draft.content_json.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{draft.content_json.summary}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{draft.content_json.features?.length ?? 0} planned features</p>
      <Button className="mt-3 h-8 text-xs" disabled={approve.isPending} onClick={() => approve.mutate(draft.id)}>
        Approve and generate
      </Button>
    </section>
  );
}
