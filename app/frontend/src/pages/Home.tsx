import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, ArrowRight, Layers, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
}

const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Dashboard App',
    description: '一个现代化的数据仪表盘应用，包含图表和指标卡片',
    updatedAt: '2 小时前',
  },
  {
    id: 'proj-2',
    title: 'E-commerce Store',
    description: '电商平台前端，支持商品展示和购物车功能',
    updatedAt: '1 天前',
  },
  {
    id: 'proj-3',
    title: 'Blog Platform',
    description: '支持 Markdown 编辑的博客系统',
    updatedAt: '3 天前',
  },
];

export default function HomePage() {
  const [input, setInput] = useState('');
  const [projects] = useState<Project[]>(DEMO_PROJECTS);
  const navigate = useNavigate();

  const handleStartBuild = () => {
    if (!input.trim()) return;
    // Navigate to workspace with the project description
    const projectId = `proj-${Date.now()}`;
    navigate(`/project/${projectId}`, { state: { prompt: input.trim() } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartBuild();
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex">
      {/* Left Sidebar - Project List */}
      <aside className="w-[280px] h-full border-r border-border/60 flex flex-col bg-card/50 flex-shrink-0">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">AI Workspace</span>
          </div>
        </div>

        {/* New Project Button */}
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-xs h-8 cursor-pointer"
            onClick={() => {
              setInput('');
              document.getElementById('project-input')?.focus();
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            新建项目
          </Button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium px-2 mb-2">
            最近项目
          </p>
          <div className="space-y-0.5">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors duration-150 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-foreground/90 truncate">
                    {project.title}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                  {project.description}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-2.5 h-2.5 text-muted-foreground/40" />
                  <span className="text-[9px] text-muted-foreground/40">{project.updatedAt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content - Project Input */}
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-[640px] space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/40 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary/70" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              描述你想构建的项目
            </h1>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
              使用自然语言描述你的想法，AI 将帮助你生成代码并构建应用
            </p>
          </div>

          {/* Input Area */}
          <div className="relative">
            <div className="rounded-2xl border border-border/80 bg-card shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300">
              <textarea
                id="project-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="例如：帮我创建一个带有用户认证的待办事项应用..."
                rows={4}
                className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <p className="text-[10px] text-muted-foreground/40">
                  按 Enter 开始构建，Shift+Enter 换行
                </p>
                <Button
                  onClick={handleStartBuild}
                  disabled={!input.trim()}
                  size="sm"
                  className="h-8 px-4 gap-2 rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-30"
                >
                  开始构建
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Start Suggestions */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground/50 text-center uppercase tracking-wider">
              快速开始
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                '数据仪表盘',
                '博客系统',
                '电商平台',
                '任务管理工具',
                '聊天应用',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(`帮我创建一个${suggestion}`)}
                  className="px-3 py-1.5 rounded-full border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-secondary/40 transition-all duration-200 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}