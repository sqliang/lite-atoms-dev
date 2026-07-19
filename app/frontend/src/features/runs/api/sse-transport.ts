/**
 * The only browser entry point for authenticated SSE.
 *
 * It isolates an older third-party dependency, validates response semantics, and keeps
 * bearer tokens out of URLs. Feature code consumes typed events rather than library APIs.
 */
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { apiBaseUrl } from '@/shared/api/client';
import { supabase } from '@/lib/supabase';
import type { SseConnectionState } from '@/features/workspace/model/workspace-store';

export interface RunEvent {
  schemaVersion: 1;
  runId: string;
  sequence: number;
  at: string;
  payload: Record<string, unknown>;
}

export interface ConnectRunEventsInput {
  projectId: string;
  runId: string;
  lastEventId?: number;
  signal: AbortSignal;
  onEvent: (type: string, event: RunEvent) => void;
  onConnectionState: (state: SseConnectionState) => void;
  onHistoryExpired: () => Promise<number>;
}

class TerminalSseError extends Error {}

/** Connect and replay a Run stream. Abort always stops retries immediately. */
export async function connectRunEvents(input: ConnectRunEventsInput): Promise<void> {
  let refreshed = false;
  input.onConnectionState('connecting');
  await fetchEventSource(`${apiBaseUrl}/v1/projects/${input.projectId}/runs/${input.runId}/events`, {
    method: 'GET',
    signal: input.signal,
    headers: await authHeaders(input.lastEventId),
    openWhenHidden: false,
    async onopen(response) {
      const contentType = response.headers.get('content-type') ?? '';
      if (response.status === 200 && contentType.includes('text/event-stream')) {
        input.onConnectionState('connected');
        return;
      }
      if (response.status === 401 && !refreshed) {
        refreshed = true;
        await supabase.auth.refreshSession();
        throw new Error('retry_after_refresh');
      }
      if (response.status === 410) {
        await input.onHistoryExpired();
        throw new Error('retry_after_snapshot');
      }
      if ([403, 404].includes(response.status)) throw new TerminalSseError(`SSE access denied (${response.status})`);
      throw new Error(`SSE request failed (${response.status})`);
    },
    onmessage(message) {
      if (!message.data || message.data === '[DONE]') return;
      const event = JSON.parse(message.data) as RunEvent;
      const id = Number(message.id);
      if (event.schemaVersion !== 1 || event.runId !== input.runId || event.sequence !== id) {
        throw new TerminalSseError('Received an invalid SSE envelope');
      }
      input.onEvent(message.event || 'message', event);
    },
    onclose() {
      input.onConnectionState('closed');
      // The server closes the stream only at a terminal Run state. Without throwing,
      // fetch-event-source would reconnect forever and endlessly replay closed history.
      throw new TerminalSseError('SSE stream closed by the server');
    },
    onerror(error) {
      if (input.signal.aborted || error instanceof TerminalSseError) throw error;
      input.onConnectionState('reconnecting');
      return Math.min(1_000 * 2 ** Math.min(3, Math.floor(Math.random() * 4)), 10_000);
    },
  });
}

async function authHeaders(lastEventId?: number): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new TerminalSseError('Authentication is required');
  return {
    Accept: 'text/event-stream',
    Authorization: `Bearer ${session.access_token}`,
    ...(lastEventId ? { 'Last-Event-ID': String(lastEventId) } : {}),
  };
}
