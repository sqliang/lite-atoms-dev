import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderDown, Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { FileNode, useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileTreeProps {
  onDownloadProject: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  searchQuery: string;
}

function flattenFiles(nodes: FileNode[], prefix = ''): { node: FileNode; path: string }[] {
  const result: { node: FileNode; path: string }[] = [];
  for (const node of nodes) {
    const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === 'file') {
      result.push({ node, path: currentPath });
    }
    if (node.type === 'folder' && node.children) {
      result.push(...flattenFiles(node.children, currentPath));
    }
  }
  return result;
}

function nodeMatchesSearch(node: FileNode, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  if (node.name.toLowerCase().includes(lowerQuery)) return true;
  if (node.type === 'folder' && node.children) {
    return node.children.some((child) => nodeMatchesSearch(child, lowerQuery));
  }
  return false;
}

function FileTreeNode({ node, depth, searchQuery }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const { openFileFromTree, activeTabId } = useWorkspace();

  const isFolder = node.type === 'folder';
  const isActive = node.id === activeTabId;

  // If searching, auto-expand folders that contain matches
  const shouldShow = !searchQuery || nodeMatchesSearch(node, searchQuery);
  const shouldAutoExpand = searchQuery && isFolder && shouldShow;

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
    if (name.endsWith('.yaml') || name.endsWith('.yml')) {
      return <span className="text-red-400 text-[10px] font-bold font-mono">YM</span>;
    }
    if (name.endsWith('.html')) {
      return <span className="text-orange-500 text-[10px] font-bold font-mono">HT</span>;
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

  if (!shouldShow) return null;

  const expanded = shouldAutoExpand || isOpen;

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
              {expanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {expanded ? (
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

      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} depth={depth + 1} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ onDownloadProject, isCollapsed, onToggleCollapse }: FileTreeProps) {
  const { projectFiles, openFileFromTree } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const allFiles = flattenFiles(projectFiles);
    return allFiles.filter(({ path }) =>
      path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, projectFiles]);

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center bg-background border-r border-border py-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 cursor-pointer mb-2"
          onClick={onToggleCollapse}
          title="Expand explorer"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setShowSearch(!showSearch)}
            title="Search files"
          >
            <Search className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 cursor-pointer"
            onClick={onToggleCollapse}
            title="Collapse explorer"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="px-2 py-1.5 border-b border-border/50">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs"
            autoFocus
          />
        </div>
      )}

      {/* Search results or file tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {searchQuery && showSearch ? (
          <div className="px-1">
            {searchResults.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-muted-foreground">No files found</p>
              </div>
            ) : (
              searchResults.map(({ node, path }) => (
                <div
                  key={node.id}
                  onClick={() => openFileFromTree(node)}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-accent/50 rounded-sm transition-colors"
                >
                  <File className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-foreground/80 truncate">{path}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          projectFiles.map((node) => (
            <FileTreeNode key={node.id} node={node} depth={0} searchQuery="" />
          ))
        )}
      </div>

      {/* Download project button */}
      <div className="p-2 border-t border-border flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs cursor-pointer"
          onClick={onDownloadProject}
        >
          <FolderDown className="w-3.5 h-3.5" />
          Download Project
        </Button>
      </div>
    </div>
  );
}