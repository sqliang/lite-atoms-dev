/**
 * @file Workspace.tsx
 * @description 工作台页面 - AI 对话 + 代码编辑器的分屏布局
 *
 * 该页面是项目的核心工作区，采用左右分屏设计：
 * - 左侧面板（38%）：AI 对话面板，用户与 Coding Agent 交互
 * - 右侧面板（62%）：代码编辑器/预览面板，展示生成的代码和预览效果
 *
 * 面板支持拖拽调整宽度（react-resizable-panels），
 * 并通过 WorkspaceProvider 共享标签页状态。
 *
 * 路由：/project/:sessionId
 * sessionId 对应 Supabase projects 表的 UUID 主键
 */

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import ChatPanel from '@/components/ChatPanel';
import WorkspacePanel from '@/components/WorkspacePanel';
import { GripVertical } from 'lucide-react';

export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      {/* 页面入场动画：从右侧滑入 + 淡入 */}
      <div className="h-screen w-screen overflow-hidden bg-background animate-in fade-in slide-in-from-right-2 duration-300">
        <PanelGroup direction="horizontal" className="h-full">
          {/* 左侧面板：AI 对话 */}
          <Panel defaultSize={38} minSize={25} maxSize={55}>
            <ChatPanel />
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
            <WorkspacePanel />
          </Panel>
        </PanelGroup>
      </div>
    </WorkspaceProvider>
  );
}