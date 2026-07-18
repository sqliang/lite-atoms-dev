import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import ChatPanel from '@/components/ChatPanel';
import WorkspacePanel from '@/components/WorkspacePanel';
import { GripVertical } from 'lucide-react';

export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <div className="h-screen w-screen overflow-hidden bg-background animate-in fade-in slide-in-from-right-2 duration-300">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left: AI Chat Panel */}
          <Panel defaultSize={38} minSize={25} maxSize={55}>
            <ChatPanel />
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-[3px] relative group cursor-col-resize">
            <div className="absolute inset-0 bg-border/40 group-hover:bg-primary/40 group-active:bg-primary/60 transition-colors duration-200" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </PanelResizeHandle>

          {/* Right: Workspace/Editor Panel */}
          <Panel defaultSize={62} minSize={35}>
            <WorkspacePanel />
          </Panel>
        </PanelGroup>
      </div>
    </WorkspaceProvider>
  );
}