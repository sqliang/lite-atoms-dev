/**
 * @file WorkspaceContext.tsx
 * @description 工作区状态管理上下文
 *
 * 该模块管理编辑器面板的全局状态，包括：
 * - 标签页系统：打开、关闭、切换编辑器标签
 * - 项目文件树：维护项目的文件/文件夹结构数据
 * - 文件操作：从文件树或附件打开文件到编辑器
 *
 * 核心数据结构：
 * - WorkspaceTab: 编辑器中的一个标签页（代码/图片/文档）
 * - FileNode: 文件树中的一个节点（文件或文件夹，递归结构）
 *
 * 当前阶段使用 Demo 数据模拟项目文件树，
 * 后续将从服务端获取真实的项目文件结构。
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * 标签页内容类型
 * - code: 代码文件，使用语法高亮渲染
 * - image: 图片文件，使用图片查看器渲染
 * - document: 文档文件（Markdown 等），使用文档查看器渲染
 */
export type TabType = 'code' | 'image' | 'document';

/**
 * 编辑器标签页数据结构
 * @property id - 标签页唯一标识（通常对应文件节点 ID）
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
 * @property id - 节点唯一标识
 * @property name - 文件/文件夹名称
 * @property type - 节点类型：file（文件）或 folder（文件夹）
 * @property children - 子节点数组（仅文件夹有）
 * @property fileType - 文件的内容类型（仅文件有）
 * @property language - 编程语言标识（仅代码文件有）
 * @property content - 文件内容（仅文件有）
 */
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  fileType?: TabType;
  language?: string;
  content?: string;
}

/**
 * 工作区上下文类型定义
 * 提供标签页管理和文件操作的完整 API
 */
interface WorkspaceContextType {
  /** 当前所有打开的标签页列表 */
  tabs: WorkspaceTab[];
  /** 当前激活标签页的 ID */
  activeTabId: string | null;
  /** 项目文件树数据 */
  projectFiles: FileNode[];
  /** 打开新标签页（如已存在则激活） */
  openTab: (tab: Omit<WorkspaceTab, 'isActive'>) => void;
  /** 关闭指定标签页 */
  closeTab: (id: string) => void;
  /** 关闭所有标签页 */
  closeAllTabs: () => void;
  /** 切换到指定标签页 */
  setActiveTab: (id: string) => void;
  /** 从文件树节点打开文件 */
  openFileFromTree: (file: FileNode) => void;
  /** 按文件名在文件树中搜索并打开（返回是否找到） */
  findAndOpenFileByName: (fileName: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

/**
 * Demo 项目文件树数据
 * 模拟一个 React + TypeScript 仪表盘项目的文件结构
 * 包含组件、页面、工具库、配置文件等
 *
 * 后续将替换为从服务端获取的真实项目文件数据
 */
const DEMO_PROJECT_FILES: FileNode[] = [
  {
    id: 'root-src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'src-components',
        name: 'components',
        type: 'folder',
        children: [
          {
            id: 'src-components-ui',
            name: 'ui',
            type: 'folder',
            children: [
              {
                id: 'file-button',
                name: 'Button.tsx',
                type: 'file',
                fileType: 'code',
                language: 'typescript',
                content: `import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2',
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';`,
              },
              {
                id: 'file-card',
                name: 'Card.tsx',
                type: 'file',
                fileType: 'code',
                language: 'typescript',
                content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}`,
              },
              {
                id: 'file-input',
                name: 'Input.tsx',
                type: 'file',
                fileType: 'code',
                language: 'typescript',
                content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';`,
              },
            ],
          },
          {
            id: 'file-dashboard-card',
            name: 'DashboardCard.tsx',
            type: 'file',
            fileType: 'code',
            language: 'typescript',
            content: `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  change: number;
  data: number[];
}

export function DashboardCard({ title, value, change, data }: DashboardCardProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 200;
      const y = 40 - ((d - min) / range) * 36;
      return \`\${x},\${y}\`;
    })
    .join(' ');

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <TrendingUp className={\`w-4 h-4 \${change >= 0 ? 'text-green-500' : 'text-red-500'}\`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {change >= 0 ? '+' : ''}{change}% from last month
        </p>
        <svg viewBox="0 0 200 44" className="w-full h-12 mt-3">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            points={points}
          />
        </svg>
      </CardContent>
    </Card>
  );
}`,
          },
          {
            id: 'file-header',
            name: 'Header.tsx',
            type: 'file',
            fileType: 'code',
            language: 'typescript',
            content: `import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <User className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}`,
          },
        ],
      },
      {
        id: 'src-pages',
        name: 'pages',
        type: 'folder',
        children: [
          {
            id: 'file-index',
            name: 'index.tsx',
            type: 'file',
            fileType: 'code',
            language: 'typescript',
            content: `import { Header } from '@/components/Header';
import { DashboardCard } from '@/components/DashboardCard';

const metrics = [
  { title: 'Total Revenue', value: '$45,231', change: 20.1, data: [10, 25, 18, 30, 28, 35, 42] },
  { title: 'Active Users', value: '2,350', change: 12.5, data: [50, 60, 55, 70, 65, 80, 85] },
  { title: 'Conversion Rate', value: '3.2%', change: -2.4, data: [4, 3.8, 3.5, 3.2, 3.0, 3.1, 3.2] },
  { title: 'Avg. Order Value', value: '$128', change: 8.3, data: [100, 110, 105, 120, 115, 125, 128] },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <DashboardCard key={metric.title} {...metric} />
          ))}
        </div>
      </main>
    </div>
  );
}`,
          },
          {
            id: 'file-settings',
            name: 'settings.tsx',
            type: 'file',
            fileType: 'code',
            language: 'typescript',
            content: `import { Header } from '@/components/Header';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-medium mb-3">Profile</h3>
            <p className="text-muted-foreground text-sm">
              Manage your account settings and preferences.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}`,
          },
        ],
      },
      {
        id: 'src-lib',
        name: 'lib',
        type: 'folder',
        children: [
          {
            id: 'file-utils',
            name: 'utils.ts',
            type: 'file',
            fileType: 'code',
            language: 'typescript',
            content: `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}`,
          },
        ],
      },
      {
        id: 'file-main',
        name: 'main.tsx',
        type: 'file',
        fileType: 'code',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      },
      {
        id: 'file-app',
        name: 'App.tsx',
        type: 'file',
        fileType: 'code',
        language: 'typescript',
        content: `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/index';
import SettingsPage from './pages/settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}`,
      },
      {
        id: 'file-index-css',
        name: 'index.css',
        type: 'file',
        fileType: 'code',
        language: 'typescript',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}`,
      },
    ],
  },
  {
    id: 'root-public',
    name: 'public',
    type: 'folder',
    children: [
      {
        id: 'file-favicon',
        name: 'favicon.svg',
        type: 'file',
        fileType: 'code',
        language: 'typescript',
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M9 3v18" />
  <path d="M3 9h6" />
</svg>`,
      },
    ],
  },
  {
    id: 'file-package',
    name: 'package.json',
    type: 'file',
    fileType: 'code',
    language: 'typescript',
    content: `{
  "name": "dashboard-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}`,
  },
  {
    id: 'file-tsconfig',
    name: 'tsconfig.json',
    type: 'file',
    fileType: 'code',
    language: 'typescript',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
  },
  {
    id: 'file-readme',
    name: 'README.md',
    type: 'file',
    fileType: 'document',
    content: `# Dashboard App

## Overview
A modern dashboard application built with React, TypeScript, and Tailwind CSS.

## Features
- Responsive metric cards with sparkline charts
- Dark/light mode support
- Component-based architecture
- Type-safe with TypeScript

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
\`\`\`

## Tech Stack
- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS 3
- React Router 6
- Lucide Icons
`,
  },
];

/**
 * 工作区状态提供者组件
 * 管理编辑器标签页的打开、关闭、切换等操作
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  /** 当前打开的所有标签页 */
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  /** 当前激活标签页的 ID */
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  /** 项目文件树数据（当前为 Demo 数据） */
  const [projectFiles] = useState<FileNode[]>(DEMO_PROJECT_FILES);

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

  /**
   * 从文件树节点打开文件
   * 忽略文件夹和无内容的节点
   */
  const openFileFromTree = useCallback((file: FileNode) => {
    if (file.type === 'folder' || !file.content) return;
    openTab({
      id: file.id,
      title: file.name,
      type: file.fileType || 'code',
      content: file.content,
      language: file.language,
    });
  }, [openTab]);

  /**
   * 按文件名在项目文件树中递归搜索并打开
   *
   * 搜索策略：深度优先遍历整个文件树，匹配文件名（精确匹配）
   * 找到后立即在编辑器中打开该文件
   *
   * @param fileName - 要搜索的文件名（如 "App.tsx"）
   * @returns 是否找到并打开了文件
   */
  const findAndOpenFileByName = useCallback((fileName: string): boolean => {
    const searchTree = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.type === 'file' && node.name === fileName) {
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
    if (file && file.content) {
      openTab({
        id: file.id,
        title: file.name,
        type: file.fileType || 'code',
        content: file.content,
        language: file.language,
      });
      return true;
    }
    return false;
  }, [projectFiles, openTab]);

  return (
    <WorkspaceContext.Provider value={{ tabs, activeTabId, projectFiles, openTab, closeTab, closeAllTabs, setActiveTab, openFileFromTree, findAndOpenFileByName }}>
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