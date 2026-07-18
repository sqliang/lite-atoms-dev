import React, { createContext, useContext, useState, useCallback } from 'react';

export type TabType = 'code' | 'image' | 'document';

export interface WorkspaceTab {
  id: string;
  title: string;
  type: TabType;
  content: string;
  language?: string;
  isActive: boolean;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  fileType?: TabType;
  language?: string;
  content?: string;
}

interface WorkspaceContextType {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  projectFiles: FileNode[];
  openTab: (tab: Omit<WorkspaceTab, 'isActive'>) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  openFileFromTree: (file: FileNode) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

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

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [projectFiles] = useState<FileNode[]>(DEMO_PROJECT_FILES);

  const openTab = useCallback((tab: Omit<WorkspaceTab, 'isActive'>) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === tab.id);
      if (existing) {
        return prev.map((t) => ({ ...t, isActive: t.id === tab.id }));
      }
      return [
        ...prev.map((t) => ({ ...t, isActive: false })),
        { ...tab, isActive: true },
      ];
    });
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length > 0) {
        const lastTab = filtered[filtered.length - 1];
        lastTab.isActive = true;
        setActiveTabId(lastTab.id);
      } else {
        setActiveTabId(null);
      }
      return filtered;
    });
  }, []);

  const setActiveTab = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
    setActiveTabId(id);
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

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

  return (
    <WorkspaceContext.Provider value={{ tabs, activeTabId, projectFiles, openTab, closeTab, closeAllTabs, setActiveTab, openFileFromTree }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}