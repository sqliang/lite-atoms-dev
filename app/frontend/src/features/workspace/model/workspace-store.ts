/** Project-scoped Zustand state for transient workspace UI, never server entities. */
import { createStore } from 'zustand/vanilla';

export type SseConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error';

export interface WorkspaceStore {
  activeFilePath: string | null;
  openFilePaths: string[];
  selectedPanel: 'code' | 'preview' | 'logs';
  streamState: SseConnectionState;
  lastAppliedSequence: number;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setPanel: (panel: WorkspaceStore['selectedPanel']) => void;
  setStreamState: (state: SseConnectionState) => void;
  applySequence: (sequence: number) => void;
}

/**
 * Create one store per project route. The caller owns destruction when navigating away,
 * preventing tabs and SSE transport state from leaking to another project.
 */
export function createWorkspaceStore() {
  return createStore<WorkspaceStore>()((set) => ({
    activeFilePath: null,
    openFilePaths: [],
    selectedPanel: 'code',
    streamState: 'idle',
    lastAppliedSequence: 0,
    openFile: (path) => set((state) => ({
      activeFilePath: path,
      openFilePaths: state.openFilePaths.includes(path) ? state.openFilePaths : [...state.openFilePaths, path],
    })),
    closeFile: (path) => set((state) => {
      const openFilePaths = state.openFilePaths.filter((candidate) => candidate !== path);
      return { openFilePaths, activeFilePath: state.activeFilePath === path ? openFilePaths.at(-1) ?? null : state.activeFilePath };
    }),
    setPanel: (selectedPanel) => set({ selectedPanel }),
    setStreamState: (streamState) => set({ streamState }),
    applySequence: (sequence) => set((state) => sequence > state.lastAppliedSequence ? { lastAppliedSequence: sequence } : state),
  }));
}
