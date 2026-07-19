/**
 * @file WorkspaceContext.tsx
 * @description 工作区状态管理上下文
 *
 * 该模块管理编辑器面板的 UI 状态，包括：
 * - 标签页系统：打开、关闭、切换编辑器标签
 * - 项目文件树：由 WorkspaceProvider 以 props 注入（来自服务端稳定版本的文件列表）
 * - 文件操作：从文件树或附件打开文件到编辑器
 *
 * 核心数据结构：
 * - WorkspaceTab: 编辑器中的一个标签页（代码/图片/文档）
 * - FileNode: 文件树中的一个节点（文件或文件夹，递归结构）
 *
 * 数据边界：文件树结构与文件内容都是服务端事实，由 React Query 在
 * features/workspace 中获取后经 props 传入；本上下文只保存标签页等 UI 状态。
 * 标签页内的文件内容是打开时刻的只读快照，不会被本地编辑。
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * 标签页内容类型
 * - code: 代码文件，使用语法高亮渲染
 * - image: 图片文件，使用图片查看器渲染
 * - document: 文档文件（Markdown 等），使用文档查看器渲染
 */
export type TabType = 'code' | 'image' | 'document';

/**
 * 编辑器标签页数据结构
 * @property id - 标签页唯一标识（文件标签对应仓库相对路径）
 * @property title - 标签页显示名称（文件名）
 * @property type - 内容类型，决定使用哪种编辑器/查看器
 * @property content - 文件内容（代码文本或图片 URL）
 * @property language - 编程语言标识（用于语法高亮）
 * @property isActive - 是否为当前激活的标签页
 */
export interface WorkspaceTab {
  id: string;
  title: string;
  type: TabType;
  content: string;
  language?: string;
  isActive: boolean;
}

/**
 * 文件树节点数据结构（递归）
 * @property id - 节点唯一标识（等于仓库相对路径）
 * @property name - 文件/文件夹名称
 * @property type - 节点类型：file（文件）或 folder（文件夹）
 * @property children - 子节点数组（仅文件夹有）
 * @property fileType - 文件的内容类型（仅文件有）
 * @property language - 编程语言标识（仅代码文件有）
 * @property path - 仓库相对路径（仅文件有），用于按需加载内容
 * @property content - 文件内容（可选；真实文件按需加载，聊天附件可内联提供）
 */
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  fileType?: TabType;
  language?: string;
  path?: string;
  content?: string;
}

/**
 * 工作区上下文类型定义
 * 提供标签页管理和文件操作的完整 API
 */
interface WorkspaceContextType {
  /** 当前项目 ID（供预览等子组件发起服务端请求） */
  projectId: string;
  /** 当前稳定版本 ID；为 null 时预览与文件均不可用 */
  stableVersionId: string | null;
  /** 活跃 Run 的当前阶段；为 null 表示没有正在进行的生成 */
  activeRunStage: string | null;
  /** 当前所有打开的标签页列表 */
  tabs: WorkspaceTab[];
  /** 当前激活标签页的 ID */
  activeTabId: string | null;
  /** 项目文件树数据（稳定版本文件与生成中草稿的合并视图） */
  projectFiles: FileNode[];
  /** 按需读取文件内容（生成中的草稿优先于稳定版本） */
  loadFileContent: (path: string) => Promise<string>;
  /** 打开新标签页（如已存在则激活） */
  openTab: (tab: Omit<WorkspaceTab, 'isActive'>) => void;
  /** 关闭指定标签页 */
  closeTab: (id: string) => void;
  /** 关闭所有标签页 */
  closeAllTabs: () => void;
  /** 切换到指定标签页 */
  setActiveTab: (id: string) => void;
  /** 流式更新已打开标签页的内容（用于生成中的草稿文件） */
  updateTabContent: (id: string, content: string) => void;
  /** 从文件树节点打开文件（真实文件按需异步加载内容） */
  openFileFromTree: (file: FileNode) => void;
  /** 按文件名在文件树中搜索并打开（返回是否找到） */
  findAndOpenFileByName: (fileName: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

/** WorkspaceProvider 的输入：路由级真实数据与内容加载器。 */
interface WorkspaceProviderProps {
  children: React.ReactNode;
  projectId: string;
  stableVersionId: string | null;
  activeRunStage: string | null;
  projectFiles: FileNode[];
  /** 生成中已写入的草稿文件（path → 内容），用于流式渲染 */
  draftFiles: Record<string, string>;
  loadFileContent: (path: string) => Promise<string>;
}

/**
 * 工作区状态提供者组件
 * 管理编辑器标签页的打开、关闭、切换等操作
 */
export function WorkspaceProvider({ children, projectId, stableVersionId, activeRunStage, projectFiles, draftFiles, loadFileContent }: WorkspaceProviderProps) {
  /** 当前打开的所有标签页 */
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  /** 当前激活标签页的 ID */
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // 生成中的草稿文件更新时，同步刷新已打开的标签页内容，形成流式渲染效果。
  useEffect(() => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id in draftFiles && tab.content !== draftFiles[tab.id]
          ? { ...tab, content: draftFiles[tab.id] }
          : tab,
      ),
    );
  }, [draftFiles]);

  /**
   * 打开标签页
   * - 如果标签页已存在：激活该标签页
   * - 如果标签页不存在：创建新标签页并激活
   */
  const openTab = useCallback((tab: Omit<WorkspaceTab, 'isActive'>) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === tab.id);
      if (existing) {
        // 标签页已存在，仅切换激活状态
        return prev.map((t) => ({ ...t, isActive: t.id === tab.id }));
      }
      // 创建新标签页，取消其他标签页的激活状态
      return [
        ...prev.map((t) => ({ ...t, isActive: false })),
        { ...tab, isActive: true },
      ];
    });
    setActiveTabId(tab.id);
  }, []);

  /**
   * 关闭标签页
   * 关闭后自动激活最后一个剩余标签页
   */
  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length > 0) {
        // 激活最后一个标签页
        const lastTab = filtered[filtered.length - 1];
        lastTab.isActive = true;
        setActiveTabId(lastTab.id);
      } else {
        setActiveTabId(null);
      }
      return filtered;
    });
  }, []);

  /** 切换到指定标签页 */
  const setActiveTab = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
    setActiveTabId(id);
  }, []);

  /** 关闭所有标签页 */
  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  /** 流式更新标签页内容；仅影响已打开的标签，不改变激活状态 */
  const updateTabContent = useCallback((id: string, content: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
  }, []);

  /**
   * 从文件树节点打开文件
   * 忽略文件夹；内联内容（聊天附件）直接打开，真实文件先开占位标签再异步填充内容
   */
  const openFileFromTree = useCallback((file: FileNode) => {
    if (file.type === 'folder') return;
    if (file.content) {
      openTab({
        id: file.id,
        title: file.name,
        type: file.fileType || 'code',
        content: file.content,
        language: file.language,
      });
      return;
    }
    if (!file.path) return;
    openTab({
      id: file.id,
      title: file.name,
      type: file.fileType || 'code',
      content: '// 正在加载文件内容…',
      language: file.language,
    });
    loadFileContent(file.path)
      .then((content) => {
        setTabs((prev) => prev.map((t) => (t.id === file.id ? { ...t, content } : t)));
      })
      .catch(() => {
        setTabs((prev) => prev.map((t) => (t.id === file.id ? { ...t, content: '// 文件内容加载失败，请关闭标签页后重试' } : t)));
      });
  }, [openTab, loadFileContent]);

  /**
   * 按文件名或仓库相对路径在项目文件树中递归搜索并打开
   *
   * 搜索策略：深度优先遍历整个文件树；工作流步骤给出的可能是全路径
   * （如 "src/App.tsx"）也可能是文件名（如 "App.tsx"），两者都要命中。
   *
   * @param fileName - 要搜索的文件名或相对路径
   * @returns 是否找到并触发了打开
   */
  const findAndOpenFileByName = useCallback(async (fileName: string): Promise<boolean> => {
    const baseName = fileName.split('/').pop() ?? fileName;
    const searchTree = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.type === 'file' && (node.path === fileName || node.name === baseName)) {
          return node;
        }
        if (node.children) {
          const found = searchTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = searchTree(projectFiles);
    if (file) {
      openFileFromTree(file);
      return true;
    }
    return false;
  }, [projectFiles, openFileFromTree]);

  return (
    <WorkspaceContext.Provider value={{ projectId, stableVersionId, activeRunStage, tabs, activeTabId, projectFiles, loadFileContent, openTab, closeTab, closeAllTabs, setActiveTab, updateTabContent, openFileFromTree, findAndOpenFileByName }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * 工作区状态 Hook
 * 在组件中使用此 hook 访问标签页管理和文件操作方法
 *
 * @example
 * const { openTab, tabs, activeTabId } = useWorkspace();
 *
 * @throws 如果在 WorkspaceProvider 外部使用会抛出错误
 */
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
