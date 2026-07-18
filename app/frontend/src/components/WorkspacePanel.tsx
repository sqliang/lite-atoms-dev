import { X, Code, FileText, Image, Layers } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useWorkspace } from '@/context/WorkspaceContext';
import CodeEditor from './editors/CodeEditor';
import ImageViewer from './editors/ImageViewer';
import DocumentViewer from './editors/DocumentViewer';
import FileTree from './FileTree';

export default function WorkspacePanel() {
  const { tabs, activeTabId, closeTab, setActiveTab } = useWorkspace();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code className="w-3 h-3" />;
      case 'image':
        return <Image className="w-3 h-3" />;
      case 'document':
        return <FileText className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* File Tree Sidebar */}
      <Panel defaultSize={22} minSize={15} maxSize={35}>
        <FileTree />
      </Panel>

      <PanelResizeHandle className="w-px bg-border hover:bg-primary/30 transition-colors" />

      {/* Editor Area */}
      <Panel defaultSize={78} minSize={50}>
        {tabs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-card text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mb-5">
              <Layers className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-medium text-foreground/60 mb-2">Editor</h3>
            <p className="text-xs text-muted-foreground/50 max-w-[240px] leading-relaxed">
              Select a file from the explorer or click preview on a chat attachment to open it here.
            </p>
          </div>
        ) : (
          <div className="h-full flex flex-col bg-card">
            {/* Tab bar */}
            <div className="flex items-center h-9 border-b border-border bg-background overflow-x-auto flex-shrink-0">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-1.5 px-3 h-full border-r border-border/30 cursor-pointer transition-colors duration-150 min-w-0 ${
                    tab.id === activeTabId
                      ? 'bg-card text-foreground border-b-0 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-primary/60'
                      : 'text-muted-foreground hover:text-foreground/80 hover:bg-secondary/20'
                  }`}
                >
                  <span className={tab.id === activeTabId ? 'text-primary' : 'text-muted-foreground/60'}>
                    {getTabIcon(tab.type)}
                  </span>
                  <span className="text-[11px] font-medium truncate max-w-[100px]">{tab.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/60 transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden">
              {activeTab && activeTab.type === 'code' && (
                <CodeEditor content={activeTab.content} language={activeTab.language} />
              )}
              {activeTab && activeTab.type === 'image' && (
                <ImageViewer content={activeTab.content} title={activeTab.title} />
              )}
              {activeTab && activeTab.type === 'document' && (
                <DocumentViewer content={activeTab.content} title={activeTab.title} />
              )}
            </div>
          </div>
        )}
      </Panel>
    </PanelGroup>
  );
}