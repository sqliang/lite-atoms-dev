/**
 * Plan 模式下的 Build Contract 审阅卡片。
 *
 * Planner 产出草案后 Run 暂停在 awaiting_approval，本卡片在会话流中展示计划全貌；
 * 用户可直接批准进入生成，或先在编辑对话框中修改（提交后产生新的 Contract 版本）。
 * Build 模式不经过此卡片（草案会被 Worker 自动批准）。
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest, ApiError } from '@/shared/api/client';

interface Contract {
  id: string;
  version: number;
  status: 'draft' | 'approved' | 'superseded';
  content_json: {
    title?: string;
    summary?: string;
    features?: string[];
    components?: { name: string; responsibility: string }[];
    nonGoals?: string[];
    acceptanceCriteria?: string[];
  };
}

/** 展示最新草案 Contract，提供编辑与批准入口。 */
export function PlanCard({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const contracts = useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => apiRequest<Contract[]>(`/v1/projects/${projectId}/contracts`),
    refetchInterval: (query) => (query.state.data?.some((item) => item.status === 'draft') ? false : 1_000),
  });
  const draft = contracts.data?.find((contract) => contract.status === 'draft');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contracts', projectId] });
    queryClient.invalidateQueries({ queryKey: ['runs', projectId] });
  };
  const approve = useMutation({
    mutationFn: (contractId: string) =>
      apiRequest(`/v1/projects/${projectId}/contracts/${contractId}/approve`, { method: 'POST' }),
    onSuccess: invalidate,
  });
  const saveEdit = useMutation({
    mutationFn: (content: unknown) =>
      apiRequest(`/v1/projects/${projectId}/contracts`, { method: 'PUT', body: JSON.stringify({ content }) }),
    onSuccess: () => {
      setEditing(false);
      setEditError(null);
      invalidate();
    },
    onError: (error) => {
      setEditError(error instanceof ApiError ? error.message : '保存失败，请检查 JSON 格式');
    },
  });

  if (!draft) return null;
  const plan = draft.content_json;

  const openEditor = () => {
    setDraftText(JSON.stringify(plan, null, 2));
    setEditError(null);
    setEditing(true);
  };
  const submitEdit = () => {
    try {
      saveEdit.mutate(JSON.parse(draftText));
    } catch {
      setEditError('JSON 格式错误，请修正后再提交');
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground/90">
            构建计划 v{draft.version}：{plan.title}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 cursor-pointer" onClick={openEditor}>
              <Pencil className="w-3 h-3" />
              编辑
            </Button>
            <Button size="sm" className="h-6 px-2.5 text-[11px] gap-1 cursor-pointer" disabled={approve.isPending} onClick={() => approve.mutate(draft.id)}>
              {approve.isPending ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              批准并生成
            </Button>
          </div>
        </div>

        {plan.summary && <p className="text-[11px] text-muted-foreground leading-relaxed">{plan.summary}</p>}

        {plan.features && plan.features.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">功能范围</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px] text-foreground/80">
              {plan.features.map((feature, index) => <li key={index}>{feature}</li>)}
            </ul>
          </div>
        )}

        {plan.components && plan.components.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">组件规划</p>
            <ul className="mt-1 space-y-1 text-[11px] text-foreground/80">
              {plan.components.map((component, index) => (
                <li key={index}>
                  <span className="font-mono text-primary/90">{component.name}</span>
                  <span className="text-muted-foreground"> — {component.responsibility}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan.nonGoals && plan.nonGoals.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">不做范围</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
              {plan.nonGoals.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        )}

        {plan.acceptanceCriteria && plan.acceptanceCriteria.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">验收条件</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px] text-foreground/80">
              {plan.acceptanceCriteria.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* 编辑对话框：直接编辑 Contract JSON，服务端校验失败时回显原因 */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑构建计划</DialogTitle>
          </DialogHeader>
          <textarea
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            className="w-full h-72 resize-none rounded-md border border-border bg-background p-3 font-mono text-[12px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/30"
            spellCheck={false}
          />
          {editError && <p className="text-xs text-destructive">{editError}</p>}
          <DialogFooter>
            <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setEditing(false)}>取消</Button>
            <Button size="sm" className="cursor-pointer" disabled={saveEdit.isPending} onClick={submitEdit}>
              {saveEdit.isPending ? '保存中…' : '保存为新版本'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
