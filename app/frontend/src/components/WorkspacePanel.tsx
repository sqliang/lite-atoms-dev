import { X, Code, FileText, Image, Layers, Copy, Download, FolderDown } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/context/WorkspaceContext';
import CodeEditor from './editors/CodeEditor';
import ImageViewer from './editors/ImageViewer';
import DocumentViewer from './editors/DocumentViewer';
import FileTree from './FileTree';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { FileNode } from '@/context/WorkspaceContext';

function collectAllFiles(nodes: FileNode[], prefix = ''): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  for (const node of nodes) {
    const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === 'folder' && node.children) {
      files.push(...collectAllFiles(node.children, currentPath));
    } else if (node.type === 'file' && node.content) {
      files.push({ path: currentPath, content: node.content });
    }
  }
  return files;
}

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
  const { tabs, activeTabId, closeTab, setActiveTab, projectFiles } = useWorkspace();

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

  const handleCopyFile = async () => {
    if (!activeTab) return;
    const content = activeTab.content;
    
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard');
        return;
      } catch {
        // Fall through to fallback
      }
    }
    
    // Fallback for non-HTTPS contexts
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

  const handleDownloadProject = async () => {
    const allFiles = collectAllFiles(projectFiles);
    if (allFiles.length === 0) {
      toast.error('No project files to download');
      return;
    }

    const zip = new JSZip();
    
    for (const file of allFiles) {
      zip.file(file.path, file.content);
    }

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'project.zip');
      toast.success('Project downloaded as ZIP');
    } catch {
      toast.error('Failed to generate ZIP file');
    }
  };

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* File Tree Sidebar */}
      <Panel defaultSize={22} minSize={15} maxSize={35}>
        <FileTree onDownloadProject={handleDownloadProject} />
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
            {/* Tab bar with actions */}
            <div className="flex items-center h-9 border-b border-border bg-background flex-shrink-0">
              <div className="flex-1 flex items-center overflow-x-auto">
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

              {/* File actions */}
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