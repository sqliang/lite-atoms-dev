import { useState, useRef } from 'react';
import { X, Code, FileText, Image, Layers, Copy, Download, Eye, SquareCode, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/context/WorkspaceContext';
import CodeEditor from './editors/CodeEditor';
import ImageViewer from './editors/ImageViewer';
import DocumentViewer from './editors/DocumentViewer';
import AppPreview from './AppPreview';
import FileTree from './FileTree';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { collectFilePaths } from '@/features/workspace/model/project-files';

type ViewMode = 'code' | 'preview';

function fallbackCopyToClipboard(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}

export default function WorkspacePanel() {
  const { tabs, activeTabId, closeTab, closeAllTabs, setActiveTab, projectFiles, loadFileContent, setSelectionReference } = useWorkspace();
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 150;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  /**
   * 捕获编辑器中的代码选区，映射为 {文件, 行区间} 引用供对话输入框使用。
   * 行号优先取逐行渲染的 data-line 标记；单块渲染时用文本匹配在原文中定位。
   */
  const handleEditorMouseUp = () => {
    if (!activeTab || !activeTab.id.includes('/')) return;
    const selection = window.getSelection();
    const text = selection?.toString() ?? '';
    if (!selection || selection.isCollapsed || !text.trim()) return;
    const lineOf = (node: Node | null): number | null => {
      const element = node instanceof Element ? node : node?.parentElement;
      const lineElement = element?.closest('[data-line]');
      return lineElement ? Number(lineElement.getAttribute('data-line')) : null;
    };
    let startLine = lineOf(selection.anchorNode);
    let endLine = lineOf(selection.focusNode);
    if (startLine == null || endLine == null) {
      const offset = activeTab.content.indexOf(text);
      if (offset < 0) return;
      startLine = activeTab.content.slice(0, offset).split('\n').length;
      endLine = startLine + text.split('\n').length - 1;
    }
    const [from, to] = startLine <= endLine ? [startLine, endLine] : [endLine, startLine];
    setSelectionReference({ path: activeTab.id, startLine: from, endLine: to });
  };

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

  const handleCopyFile = async () => {
    if (!activeTab) return;
    const content = activeTab.content;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard');
        return;
      } catch {
        // Fall through to fallback
      }
    }

    const success = fallbackCopyToClipboard(content);
    if (success) {
      toast.success('Copied to clipboard');
    } else {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadFile = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${activeTab.title}`);
  };

  /** 整包下载：稳定版本的文件内容不在文件树中内联，按需逐个拉取后打包 */
  const handleDownloadProject = async () => {
    const paths = collectFilePaths(projectFiles);
    if (paths.length === 0) {
      toast.error('暂无可下载的项目文件');
      return;
    }

    try {
      const contents = await Promise.all(paths.map((path) => loadFileContent(path)));
      const zip = new JSZip();
      paths.forEach((path, index) => zip.file(path, contents[index]));
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'project.zip');
      toast.success('Project downloaded as ZIP');
    } catch {
      toast.error('Failed to generate ZIP file');
    }
  };

  return (
    <PanelGroup direction="horizontal" className="h-full" key={viewMode}>
      {/* File Tree Sidebar：仅 Code 模式展示，预览模式下隐藏让出宽度 */}
      {viewMode === 'code' && (
        <>
          <Panel
            defaultSize={isTreeCollapsed ? 3 : 22}
            minSize={isTreeCollapsed ? 3 : 15}
            maxSize={isTreeCollapsed ? 4 : 35}
          >
            <FileTree
              onDownloadProject={handleDownloadProject}
              isCollapsed={isTreeCollapsed}
              onToggleCollapse={() => setIsTreeCollapsed(!isTreeCollapsed)}
            />
          </Panel>

          <PanelResizeHandle className="w-px bg-border hover:bg-primary/30 transition-colors" />
        </>
      )}

      {/* Editor / Preview Area */}
      <Panel defaultSize={viewMode === 'code' ? 78 : 100} minSize={50}>
        <div className="h-full flex flex-col bg-card">
          {/* Top toolbar with view mode toggle */}
          <div className="flex items-center h-9 border-b border-border bg-background flex-shrink-0">
            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 px-2 border-r border-border/50">
              <Button
                variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer"
                onClick={() => setViewMode('code')}
              >
                <SquareCode className="w-3.5 h-3.5" />
                Code
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </Button>
            </div>

            {/* Tabs (only in code mode) */}
            {viewMode === 'code' && (
              <div className="flex-1 flex items-center overflow-hidden min-w-0">
                {/* Scroll left button */}
                {tabs.length > 0 && (
                  <button
                    onClick={() => scrollTabs('left')}
                    className="flex-shrink-0 w-5 h-full flex items-center justify-center hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}

                {/* Scrollable tabs container */}
                <div
                  ref={tabsContainerRef}
                  className="flex-1 flex items-center overflow-x-auto scrollbar-hide"
                >
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex items-center gap-1.5 px-3 h-full border-r border-border/30 cursor-pointer transition-colors duration-150 flex-shrink-0 ${
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

                {/* Scroll right button */}
                {tabs.length > 0 && (
                  <button
                    onClick={() => scrollTabs('right')}
                    className="flex-shrink-0 w-5 h-full flex items-center justify-center hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}

                {/* Close all tabs button */}
                {tabs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 flex-shrink-0 mx-1 cursor-pointer"
                    onClick={closeAllTabs}
                    title="关闭所有文件"
                  >
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </div>
            )}

            {/* Preview title */}
            {viewMode === 'preview' && (
              <div className="flex-1 flex items-center px-3">
                <span className="text-[11px] text-muted-foreground">Application Preview</span>
              </div>
            )}

            {/* File actions (only in code mode when a file is open) */}
            {viewMode === 'code' && activeTab && (
              <div className="flex items-center gap-0.5 px-2 border-l border-border/50 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 cursor-pointer"
                  onClick={handleCopyFile}
                  title="Copy file content"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 cursor-pointer"
                  onClick={handleDownloadFile}
                  title="Download current file"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'preview' ? (
              <AppPreview />
            ) : (
              <>
                {tabs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mb-5">
                      <Layers className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground/60 mb-2">Editor</h3>
                    <p className="text-xs text-muted-foreground/50 max-w-[240px] leading-relaxed">
                      Select a file from the explorer or click preview on a chat attachment to open it here.
                    </p>
                  </div>
                ) : (
                  <>
                    {activeTab && activeTab.type === 'code' && (
                      <div className="h-full" onMouseUp={handleEditorMouseUp}>
                        <CodeEditor content={activeTab.content} language={activeTab.language} />
                      </div>
                    )}
                    {activeTab && activeTab.type === 'image' && (
                      <ImageViewer content={activeTab.content} title={activeTab.title} />
                    )}
                    {activeTab && activeTab.type === 'document' && (
                      <DocumentViewer content={activeTab.content} title={activeTab.title} />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  );
}