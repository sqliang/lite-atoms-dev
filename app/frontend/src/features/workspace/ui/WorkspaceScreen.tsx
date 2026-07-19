/**
 * Real project workbench screen: the original split-panel workbench UI wired to FastAPI
 * projections and persisted SSE run events.
 *
 * State ownership follows the platform rules: React Query holds server facts (project,
 * runs, stable files); WorkspaceContext holds editor-tab UI state; this component owns
 * the SSE event feed for the newest run, in-progress draft files streamed by
 * `builder.file_written` events, and locally echoed instructions (the messages read
 * endpoint is deferred, so a refresh drops unsent-history echoes).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import ChatPanel, { type RunReferenceInput } from '@/components/ChatPanel';
import WorkspacePanel from '@/components/WorkspacePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, apiRequest } from '@/shared/api/client';
import { connectRunEvents, type RunEvent } from '@/features/runs/api/sse-transport';
import { buildFileTree } from '@/features/workspace/model/project-files';

export interface Project {
  id: string;
  title: string;
  original_prompt: string;
  lifecycle_status: string;
  stable_version_id: string | null;
}

export interface Run {
  id: string;
  kind: 'initial' | 'update' | 'retry' | 'restore';
  status: 'queued' | 'claimed' | 'running' | 'awaiting_approval' | 'cancelling' | 'completed' | 'failed' | 'cancelled';
  stage: string | null;
  repair_attempts: number;
  error_code: string | null;
  error_message: string | null;
}

/** One persisted SSE event with its stream type, as rendered by the chat workflow steps. */
export interface StreamEvent {
  type: string;
  event: RunEvent;
}

interface ProjectFile {
  path: string;
  content: string;
}

/** One persisted chat message from the server. */
export interface ChatMessageRecord {
  id: string;
  run_id: string | null;
  role: 'user' | 'assistant' | 'system';
  visible_content: string;
  created_at: string;
}

interface BuildLog {
  attempt_no: number;
  status: string;
  diagnostics: string | null;
}

interface Contract {
  id: string;
  status: 'draft' | 'approved' | 'superseded';
}

/** One promoted project version, as shown in the version switcher. */
export interface ProjectVersion {
  id: string;
  commit_sha: string;
  message: string;
  origin_kind: string;
  created_at: string;
  is_stable: boolean;
  has_artifact: boolean;
}

const ACTIVE_RUN_STATUSES = new Set<Run['status']>(['queued', 'claimed', 'running', 'awaiting_approval']);

/** Compose chat, explorer, editor, and preview around one project's real state. */
export function WorkspaceScreen({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<StreamEvent[]>([]);
  /** Files written by the newest run before promotion: path → latest streamed content. */
  const [draftFiles, setDraftFiles] = useState<Record<string, string>>({});

  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiRequest<Project>(`/v1/projects/${projectId}`),
  });
  const runs = useQuery({
    queryKey: ['runs', projectId],
    queryFn: () => apiRequest<Run[]>(`/v1/projects/${projectId}/runs`),
    refetchInterval: (query) =>
      query.state.data?.some((run) => ACTIVE_RUN_STATUSES.has(run.status) || run.status === 'cancelling') ? 1_000 : false,
  });
  // Runs arrive newest first; the workspace always follows the newest one.
  const currentRun = runs.data?.[0];
  const stableVersionId = project.data?.stable_version_id ?? null;
  // The version switcher: null means the current stable (latest) version.
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const versions = useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => apiRequest<ProjectVersion[]>(`/v1/projects/${projectId}/versions`),
  });
  const selectedVersion = versions.data?.find((version) => version.id === selectedVersionId) ?? null;
  const files = useQuery({
    queryKey: ['files', projectId, selectedVersionId ?? stableVersionId],
    queryFn: () =>
      apiRequest<string[]>(
        selectedVersionId
          ? `/v1/projects/${projectId}/versions/${selectedVersionId}/files`
          : `/v1/projects/${projectId}/files`,
      ),
    enabled: Boolean(selectedVersionId || stableVersionId),
  });

  // Shared with the ContractApproval card; decides which Run kind a retry needs.
  const contracts = useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => apiRequest<Contract[]>(`/v1/projects/${projectId}/contracts`),
  });

  // Persisted conversation: user instructions and assistant summaries survive refresh.
  const messages = useQuery({
    queryKey: ['messages', projectId],
    queryFn: () => apiRequest<ChatMessageRecord[]>(`/v1/projects/${projectId}/messages`),
  });

  // Build diagnostics are only fetched when the newest run needs them.
  const buildLog = useQuery({
    queryKey: ['build-log', projectId, currentRun?.id],
    queryFn: () => apiRequest<BuildLog | null>(`/v1/projects/${projectId}/build-log`),
    enabled: currentRun?.status === 'failed',
  });

  const startRun = useMutation({
    mutationFn: (input: { kind: Run['kind']; instruction?: string; references?: RunReferenceInput[] }) =>
      apiRequest<Run>(`/v1/projects/${projectId}/runs`, {
        method: 'POST',
        body: JSON.stringify({ kind: input.kind, request_id: crypto.randomUUID(), instruction: input.instruction, references: input.references ?? [] }),
      }),
    onSuccess: () => {
      // The user message was persisted by create_run; refresh history and run state.
      queryClient.invalidateQueries({ queryKey: ['runs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError && error.status === 409
          ? '需要先确认 Build Contract 才能继续生成'
          : '发送失败，请稍后重试',
      );
    },
  });

  const cancelRun = useMutation({
    mutationFn: (runId: string) =>
      apiRequest<Run>(`/v1/projects/${projectId}/runs/${runId}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError && error.status === 409 ? '当前状态无法终止' : '终止失败，请稍后重试');
    },
  });

  /** Recover a failed Run: re-plan without a contract, otherwise retry the approved one. */
  const retryFailedRun = () => {
    const hasApprovedContract = contracts.data?.some((contract) => contract.status === 'approved');
    startRun.mutate({ kind: hasApprovedContract ? 'retry' : 'initial' });
  };

  // Replay the newest run's persisted events (works for terminal runs too), then follow
  // it live while it is active. A terminal event refreshes the server projections.
  useEffect(() => {
    if (!currentRun) return;
    const controller = new AbortController();
    setEvents([]);
    setDraftFiles({});
    void connectRunEvents({
      projectId,
      runId: currentRun.id,
      signal: controller.signal,
      onConnectionState: () => undefined,
      onHistoryExpired: async () => 0,
      onEvent: (type, event) => {
        setEvents((previous) =>
          previous.some((item) => item.event.sequence === event.sequence)
            ? previous
            : [...previous, { type, event }],
        );
        if (type === 'builder.file_written') {
          const path = String(event.payload.path ?? '');
          const content = String(event.payload.content ?? '');
          if (path) setDraftFiles((previous) => ({ ...previous, [path]: content }));
        }
        queryClient.invalidateQueries({ queryKey: ['runs', projectId] });
        if (type === 'version.promoted' || type === 'run.claimed' || type === 'planner.started') {
          // project 查询同时承载语义化标题（Worker 在规划期间并行更新）。
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }
        if (type === 'version.promoted' || type === 'run.failed' || type === 'run.cancelled') {
          // 终态时 Worker 已写入 assistant 摘要/诊断消息。
          queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
          queryClient.invalidateQueries({ queryKey: ['build-log', projectId] });
        }
        if (type === 'version.promoted') {
          queryClient.invalidateQueries({ queryKey: ['files', projectId] });
          queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
          queryClient.invalidateQueries({ queryKey: ['preview-ticket', projectId] });
        }
      },
    }).catch(() => undefined);
    return () => controller.abort();
  }, [currentRun?.id, projectId, queryClient]);

  const isRunActive = Boolean(currentRun && ACTIVE_RUN_STATUSES.has(currentRun.status));
  const isCancelling = currentRun?.status === 'cancelling';
  /** Switch the code/preview view to a historical version; null restores the latest. */
  const handleSelectVersion = (versionId: string | null) => {
    setSelectedVersionId(versionId);
    if (versionId) {
      const version = versions.data?.find((candidate) => candidate.id === versionId);
      toast.info(`已切换到历史版本 ${version?.commit_sha.slice(0, 7) ?? ''}，代码与预览为只读内容`);
    } else {
      toast.info('已回到最新版本');
    }
  };
  // The explorer merges stable files with in-progress draft paths so generated files
  // appear as they are written; draft content wins over the stable copy of the same path.
  // Drafts only apply to the live (latest) view, never to a historical version.
  const projectFiles = useMemo(() => {
    const paths = new Set(files.data ?? []);
    if (!selectedVersionId) Object.keys(draftFiles).forEach((path) => paths.add(path));
    return buildFileTree([...paths]);
  }, [files.data, draftFiles, selectedVersionId]);
  const loadFileContent = useCallback(
    (path: string) => {
      if (!selectedVersionId && path in draftFiles) return Promise.resolve(draftFiles[path]);
      const url = selectedVersionId
        ? `/v1/projects/${projectId}/versions/${selectedVersionId}/files/${path}`
        : `/v1/projects/${projectId}/files/${path}`;
      return apiRequest<ProjectFile>(url).then((file) => file.content);
    },
    [projectId, draftFiles, selectedVersionId],
  );
  const activeRunStage = selectedVersionId
    ? null
    : isRunActive || isCancelling
      ? currentRun?.stage ?? currentRun?.status ?? null
      : null;

  if (project.isLoading) {
    // 骨架屏保持详情页布局结构，避免刷新后长时间空白让用户误以为页面异常。
    return (
      <div className="flex h-screen w-screen bg-background">
        <div className="flex w-[38%] min-w-[300px] flex-col border-r border-border/60">
          <div className="flex h-12 items-center gap-2 border-b border-border/60 px-4">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <div className="flex-1 space-y-4 p-4">
            <div className="flex justify-end"><Skeleton className="h-12 w-2/3 rounded-xl" /></div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
          <div className="border-t border-border/60 p-3">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex h-9 items-center gap-2 border-b border-border px-3">
            <Skeleton className="h-5 w-14 rounded" />
            <Skeleton className="h-5 w-14 rounded" />
          </div>
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            正在加载项目数据…
          </div>
        </div>
      </div>
    );
  }
  if (!project.data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-destructive">
        项目不存在或无权访问。
      </div>
    );
  }

  return (
    <WorkspaceProvider
      projectId={projectId}
      stableVersionId={stableVersionId}
      selectedVersionId={selectedVersionId}
      activeRunStage={activeRunStage}
      projectFiles={projectFiles}
      draftFiles={draftFiles}
      loadFileContent={loadFileContent}
    >
      {/* 页面入场动画：从右侧滑入 + 淡入 */}
      <div className="h-screen w-screen overflow-hidden bg-background animate-in fade-in slide-in-from-right-2 duration-300">
        <PanelGroup direction="horizontal" className="h-full">
          {/* 左侧面板：AI 对话 */}
          <Panel defaultSize={38} minSize={25} maxSize={55}>
            <ChatPanel
              projectId={projectId}
              projectName={project.data.title}
              originalPrompt={project.data.original_prompt}
              runs={runs.data ?? []}
              events={events}
              history={messages.data ?? []}
              versions={versions.data ?? []}
              selectedVersionId={selectedVersionId}
              onSelectVersion={handleSelectVersion}
              buildDiagnostics={currentRun?.status === 'failed' ? buildLog.data?.diagnostics ?? null : null}
              onSend={(instruction, references) => startRun.mutate({ kind: 'update', instruction, references })}
              onRetry={retryFailedRun}
              onCancel={() => currentRun && cancelRun.mutate(currentRun.id)}
              isSending={startRun.isPending}
              isCancelling={cancelRun.isPending || isCancelling}
            />
          </Panel>

          {/* 可拖拽的分隔线 */}
          <PanelResizeHandle className="w-[3px] relative group cursor-col-resize">
            <div className="absolute inset-0 bg-border/40 group-hover:bg-primary/40 group-active:bg-primary/60 transition-colors duration-200" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </PanelResizeHandle>

          {/* 右侧面板：代码编辑器/预览 */}
          <Panel defaultSize={62} minSize={35}>
            <div className="flex h-full flex-col">
              {selectedVersion && (
                <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 flex-shrink-0">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 truncate">
                    正在查看历史版本 {selectedVersion.commit_sha.slice(0, 7)}（{selectedVersion.message}）· 只读
                  </span>
                  <button
                    className="text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:underline cursor-pointer flex-shrink-0"
                    onClick={() => handleSelectVersion(null)}
                  >
                    回到最新版本
                  </button>
                </div>
              )}
              <div className="flex-1 min-h-0">
                <WorkspacePanel />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </WorkspaceProvider>
  );
}
