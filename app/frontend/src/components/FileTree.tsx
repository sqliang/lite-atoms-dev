import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { FileNode, useWorkspace } from '@/context/WorkspaceContext';

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const { openFileFromTree, activeTabId } = useWorkspace();

  const isFolder = node.type === 'folder';
  const isActive = node.id === activeTabId;

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) {
      return <span className="text-blue-400 text-[10px] font-bold font-mono">TS</span>;
    }
    if (name.endsWith('.css')) {
      return <span className="text-purple-400 text-[10px] font-bold font-mono">CS</span>;
    }
    if (name.endsWith('.json')) {
      return <span className="text-yellow-400 text-[10px] font-bold font-mono">{'{}'}</span>;
    }
    if (name.endsWith('.md')) {
      return <span className="text-muted-foreground text-[10px] font-bold font-mono">MD</span>;
    }
    if (name.endsWith('.svg')) {
      return <span className="text-orange-400 text-[10px] font-bold font-mono">SV</span>;
    }
    return <File className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      openFileFromTree(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1 py-[3px] px-2 cursor-pointer transition-colors duration-100 rounded-sm mx-1 ${
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/50 text-foreground/80'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center text-muted-foreground">
              {isOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </span>
          </>
        ) : (
          <>
            <span className="flex-shrink-0 w-3.5 h-3.5" />
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {getFileIcon(node.name)}
            </span>
          </>
        )}
        <span className="text-[12px] truncate ml-0.5">{node.name}</span>
      </div>

      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree() {
  const { projectFiles } = useWorkspace();

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Explorer
        </span>
      </div>

      {/* Project name */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50">
        <Folder className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[12px] font-medium text-foreground">dashboard-app</span>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {projectFiles.map((node) => (
          <FileTreeNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}