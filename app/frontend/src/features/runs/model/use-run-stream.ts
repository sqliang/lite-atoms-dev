/** Connect one Run’s persisted SSE events and refresh only affected server projections. */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectRunEvents } from '@/features/runs/api/sse-transport';

/**
 * Keep sequencing in React Query’s transport projection rather than duplicate Run entities
 * in Zustand. A later workspace provider can subscribe to its connection UI independently.
 */
export function useRunStream(projectId: string | undefined, runId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!projectId || !runId) return;
    const controller = new AbortController();
    let lastSequence = 0;
    void connectRunEvents({
      projectId,
      runId,
      signal: controller.signal,
      onConnectionState: () => undefined,
      onHistoryExpired: async () => {
        const snapshot = await queryClient.fetchQuery({ queryKey: ['run', projectId, runId] });
        return Number((snapshot as { last_sequence?: number }).last_sequence ?? 0);
      },
      onEvent: (_type, event) => {
        if (event.sequence <= lastSequence) return;
        lastSequence = event.sequence;
        queryClient.invalidateQueries({ queryKey: ['run', projectId, runId] });
        if (event.payload.stage === 'promoting' || event.payload.versionId) {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['contracts', projectId] });
        }
      },
    }).catch(() => undefined);
    return () => controller.abort();
  }, [projectId, runId, queryClient]);
}
