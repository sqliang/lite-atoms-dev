/**
 * @file FileTree.tsx
 * @description 文件资源管理器组件
 *
 * 该组件实现了工作台右侧编辑器面板中的文件树导航，功能包括：
 * - 递归渲染项目文件/文件夹树形结构
 * - 文件搜索过滤（模糊匹配文件路径）
 * - 文件夹展开/折叠
 * - 点击文件在编辑器中打开
 * - 面板折叠/展开切换
 * - 项目整体下载（ZIP 格式）
 *
 * 文件图标根据扩展名动态显示不同颜色标识：
 * - .ts/.tsx → 蓝色 TS
 * - .css → 紫色 CS
 * - .json → 黄色 {}
 * - .md → 灰色 MD
 * - .svg → 橙色 SV
 */

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderDown, Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { FileNode, useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileTreeProps {
  /** 触发项目下载的回调函数 */
  onDownloadProject: () => void;
  /** 面板是否处于折叠状态 */
  isCollapsed: boolean;
  /** 切换面板折叠/展开的回调 */
  onToggleCollapse: () => void;
}

interface FileTreeNodeProps {
  node: FileNode;
  /** 当前节点的嵌套深度，用于计算缩进 */
  depth: number;
  /** 当前搜索关键词，用于高亮和过滤 */
  searchQuery: string;
}

/**
 * 将嵌套的文件树结构扁平化为一维数组
 * 用于搜索功能，将所有文件及其完整路径提取出来
 *
 * @param nodes - 文件树节点数组
 * @param prefix - 当前路径前缀（递归累积）
 * @returns 扁平化的文件节点数组，每项包含节点和完整路径
 */
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

/**
 * 递归检查节点或其子节点是否匹配搜索关键词
 * 用于决定文件树节点是否应该显示
 *
 * @param node - 待检查的文件树节点
 * @param query - 搜索关键词（小写）
 * @returns 是否匹配
 */
function nodeMatchesSearch(node: FileNode, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  if (node.name.toLowerCase().includes(lowerQuery)) return true;
  if (node.type === 'folder' && node.children) {
    return node.children.some((child) => nodeMatchesSearch(child, lowerQuery));
  }
  return false;
}

/**
 * 文件树单节点组件
 * 递归渲染文件/文件夹节点，支持展开折叠和点击打开
 */
function FileTreeNode({ node, depth, searchQuery }: FileTreeNodeProps) {
  /** 默认展开前两层目录 */
  const [isOpen, setIsOpen] = useState(depth < 2);
  const { openFileFromTree, activeTabId } = useWorkspace();

  const isFolder = node.type === 'folder';
  /** 当前节点是否为编辑器中激活的文件 */
  const isActive = node.id === activeTabId;

  // 搜索模式下的显示/展开逻辑
  const shouldShow = !searchQuery || nodeMatchesSearch(node, searchQuery);
  const shouldAutoExpand = searchQuery && isFolder && shouldShow;

  /**
   * 根据文件扩展名返回对应的彩色图标
   * 使用 monospace 字体的缩写标识不同文件类型
   */
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

  /** 点击处理：文件夹切换展开，文件打开到编辑器 */
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
        className={`relative flex items-center gap-1 py-[3px] px-2 cursor-pointer transition-colors duration-100 rounded-sm mx-1 ${
          isActive
            ? 'bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-0.5 before:rounded-full before:bg-primary'
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

      {/* 递归渲染子节点 */}
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

/**
 * 文件资源管理器主组件
 * 包含搜索栏、文件树、下载按钮，支持面板折叠
 */
export default function FileTree({ onDownloadProject, isCollapsed, onToggleCollapse }: FileTreeProps) {
  const { projectFiles, openFileFromTree } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  /**
   * 搜索结果计算（使用 useMemo 优化性能）
   * 将文件树扁平化后按路径模糊匹配过滤
   */
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const allFiles = flattenFiles(projectFiles);
    return allFiles.filter(({ path }) =>
      path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, projectFiles]);

  // 折叠状态：只显示展开按钮
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
      {/* 顶部标题栏 */}
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

      {/* 搜索输入框（可切换显示） */}
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

      {/* 文件列表区域 */}
      <div className="flex-1 overflow-y-auto py-1">
        {searchQuery && showSearch ? (
          // 搜索结果模式：显示匹配的文件列表
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
        ) : projectFiles.length === 0 ? (
          // 稳定版本尚未发布：文件树为空
          <div className="px-3 py-6 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              首个稳定版本发布后，生成的项目文件将展示在这里。
            </p>
          </div>
        ) : (
          // 正常模式：渲染完整文件树
          projectFiles.map((node) => (
            <FileTreeNode key={node.id} node={node} depth={0} searchQuery="" />
          ))
        )}
      </div>

      {/* 底部下载按钮 */}
      <div className="p-2 border-t border-border flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs cursor-pointer"
          onClick={onDownloadProject}
        >
          <FolderDown className="w-3.5 h-3.5" />
          下载项目
        </Button>
      </div>
    </div>
  );
}