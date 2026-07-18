import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Layers, Clock, ChevronRight, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

/**
 * Generate a unique session ID for a new project conversation.
 * TODO: Replace with server-side session ID generation via API call.
 * e.g., const sessionId = await fetch('/api/sessions', { method: 'POST' }).then(r => r.json()).then(d => d.id);
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

interface Project {
  sessionId: string;
  title: string;
  description: string;
  updatedAt: string;
}

/**
 * Demo project list.
 * TODO: Fetch from server using user's session history API.
 */
const DEMO_PROJECTS: Project[] = [
  {
    sessionId: 'session-1720000000000-abc123',
    title: 'Dashboard App',
    description: '一个现代化的数据仪表盘应用，包含图表和指标卡片',
    updatedAt: '2 小时前',
  },
  {
    sessionId: 'session-1719900000000-def456',
    title: 'E-commerce Store',
    description: '电商平台前端，支持商品展示和购物车功能',
    updatedAt: '1 天前',
  },
  {
    sessionId: 'session-1719800000000-ghi789',
    title: 'Blog Platform',
    description: '支持 Markdown 编辑的博客系统',
    updatedAt: '3 天前',
  },
];

export default function HomePage() {
  const [input, setInput] = useState('');
  const [projects] = useState<Project[]>(DEMO_PROJECTS);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleStartBuild = () => {
    if (!input.trim()) return;
    // Generate a session ID for this new conversation
    // TODO: In production, fetch session ID from server API
    const sessionId = generateSessionId();
    navigate(`/project/${sessionId}`, { state: { prompt: input.trim() } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartBuild();
    }
  };

  const handleProjectClick = (sessionId: string) => {
    navigate(`/project/${sessionId}`);
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
          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-7 h-7 rounded-full bg-secondary border border-border/60 flex items-center justify-center hover:bg-secondary/80 transition-colors cursor-pointer"
              title={user?.email || ''}
            >
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-9 w-48 bg-card border border-border/80 rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-border/40">
                  <p className="text-[11px] text-muted-foreground/60">登录账户</p>
                  <p className="text-xs text-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium px-2 mb-2">
            最近项目
          </p>
          <div className="space-y-0.5">
            {projects.map((project) => (
              <button
                key={project.sessionId}
                onClick={() => handleProjectClick(project.sessionId)}
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