/**
 * @file AppPreview.tsx
 * @description 应用预览面板 - 嵌入隔离预览 Origin 中的稳定版本
 *
 * 保留原有工具栏交互（设备尺寸切换、刷新、新窗口打开），
 * 内容区从模拟 Dashboard 替换为真实的稳定产物 iframe：
 * 通过一次性 preview ticket 引导，随后由 HttpOnly 会话保持访问，
 * 平台凭证不会进入生成应用的运行环境。
 */
import { useState } from 'react';
import { RefreshCw, Smartphone, Monitor, Tablet, ExternalLink, MonitorPlay, LoaderCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/shared/api/client';
import { useWorkspace } from '@/context/WorkspaceContext';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface PreviewTicket {
  bootstrap_url: string;
  expires_at: string;
}

/** 各生成阶段在预览占位区的提示文案 */
const STAGE_PREVIEW_HINTS: Record<string, string> = {
  planning: '正在规划 Build Contract…',
  generating: '正在生成项目代码…',
  validating: '正在校验生成的代码…',
  typechecking: '正在执行 TypeScript 检查与 Vite 构建…',
  repairing: '构建未通过，正在自动修复…',
  committing: '构建成功，正在提交版本…',
  promoting: '正在发布预览产物…',
};

export default function AppPreview() {
  const { projectId, stableVersionId, selectedVersionId, activeRunStage } = useWorkspace();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  /** 递增以强制 iframe 重新加载 */
  const [refreshKey, setRefreshKey] = useState(0);

  const ticket = useQuery({
    // stableVersionId 变化（新版本发布）会自动换新 ticket，预览随之刷新
    queryKey: ['preview-ticket', projectId, selectedVersionId ?? stableVersionId ?? 'none', refreshKey],
    queryFn: () =>
      apiRequest<PreviewTicket>(
        selectedVersionId
          ? `/v1/projects/${projectId}/versions/${selectedVersionId}/preview-ticket`
          : `/v1/projects/${projectId}/preview-ticket`,
      ),
    enabled: Boolean(selectedVersionId || stableVersionId),
    retry: false,
  });

  const previewHost = ticket.data ? new URL(ticket.data.bootstrap_url).host : 'preview';

  const getPreviewWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleOpenExternal = () => {
    if (ticket.data) {
      window.open(ticket.data.bootstrap_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-border/50 flex-shrink-0">
        {/* Device toggles */}
        <div className="flex items-center gap-1">
          <Button
            variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setDeviceMode('desktop')}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setDeviceMode('tablet')}
            title="Tablet view"
          >
            <Tablet className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setDeviceMode('mobile')}
            title="Mobile view"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* URL bar */}
        <div className="flex-1 mx-3">
          <div className="flex items-center h-5 px-2.5 bg-secondary/40 rounded text-[10px] text-muted-foreground font-mono">
            <span className="text-green-500 mr-1.5">●</span>
            {previewHost}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={handleRefresh}
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={handleOpenExternal}
            disabled={!ticket.data}
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-hidden flex items-start justify-center p-4 bg-secondary/20">
        {stableVersionId ? (
          <div
            className={`${getPreviewWidth()} relative h-full bg-white rounded-lg shadow-lg overflow-hidden border border-border/50 transition-all duration-300`}
          >
            {ticket.data ? (
              <iframe
                key={`${selectedVersionId ?? 'stable'}-${refreshKey}`}
                className="absolute inset-0 h-full w-full border-0"
                title="Stable generated application preview"
                src={ticket.data.bootstrap_url}
                sandbox="allow-scripts allow-forms allow-same-origin"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {ticket.isError
                  ? selectedVersionId
                    ? '该版本没有可用的预览产物'
                    : '预览授权失败，请点击刷新重试'
                  : '正在获取预览授权…'}
              </div>
            )}
          </div>
        ) : activeRunStage ? (
          /* 生成中：预览尚不可用，用动画明确告知构建进度 */
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <LoaderCircle className="w-8 h-8 text-primary/70 animate-spin mb-4" />
            <p className="text-xs font-medium text-foreground/70 mb-1">正在构建预览</p>
            <p className="text-[11px] text-muted-foreground/70 max-w-[260px] leading-relaxed animate-pulse">
              {STAGE_PREVIEW_HINTS[activeRunStage] ?? '正在处理…'}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-3 max-w-[260px] leading-relaxed">
              构建成功并提升为稳定版本后，预览会自动可用。
            </p>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4">
              <MonitorPlay className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground/70 max-w-[260px] leading-relaxed">
              预览将在首个稳定版本发布后可用：Worker 完成校验、构建并提升版本后自动就绪。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
