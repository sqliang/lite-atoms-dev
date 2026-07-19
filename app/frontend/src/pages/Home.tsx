/**
 * @file Home.tsx
 * @description 首页 - 项目列表与新建项目入口
 *
 * 该页面是用户登录后的主界面，包含以下核心功能：
 * 1. 左侧边栏：展示用户历史项目列表（从 Supabase 实时查询）
 * 2. 主区域：项目需求输入框，用户描述需求后创建新项目
 * 3. 底部用户信息：显示当前登录用户邮箱和登出入口
 *
 * 核心业务流程（Session 预生成）：
 * - 用户输入构建需求 → 点击"开始构建"
 * - 前端向 Supabase `projects` 表插入一条新记录
 * - 获取返回的 project UUID 作为 session_id
 * - 携带 session_id 跳转到工作台页面 /project/:sessionId
 *
 * 数据表结构参考：
 * projects (id UUID PK, user_id UUID FK, name, description, current_commit_id, created_at, updated_at)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Layers, Clock, ChevronRight, LogOut, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * 项目列表项数据结构
 * @property sessionId - 项目唯一标识（对应 projects.id），用于 URL 路由
 * @property title - 项目名称，默认为"未命名项目"
 * @property description - 项目描述，即用户最初输入的构建需求
 * @property updatedAt - 相对时间字符串（如"2 小时前"）
 */
interface Project {
  sessionId: string;
  title: string;
  description: string;
  updatedAt: string;
}

/**
 * 将 ISO 时间字符串转换为中文相对时间描述
 * @param dateStr - ISO 8601 格式的时间字符串
 * @returns 中文相对时间（如"刚刚"、"5 分钟前"、"2 天前"）
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} 天前`;
  return `${Math.floor(diffDay / 30)} 个月前`;
}

export default function HomePage() {
  /** 用户输入的项目构建需求文本 */
  const [input, setInput] = useState('');
  /** 从 Supabase 查询到的用户项目列表 */
  const [projects, setProjects] = useState<Project[]>([]);
  /** 控制用户菜单弹窗的显示/隐藏 */
  const [showUserMenu, setShowUserMenu] = useState(false);
  /** 项目创建中的加载状态，防止重复提交 */
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  /**
   * 获取当前用户的项目列表
   * 从 Supabase projects 表查询，按更新时间倒序排列，最多返回 20 条
   * 如果用户没有任何项目，自动插入 mock 数据用于调试
   */
  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('app_bd56170962_projects')
        .select('id, name, description, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      // 如果用户项目少于 3 个，自动插入 mock 数据补充到至少 3 个
      if (!data || data.length < 3) {
        await supabase.rpc('insert_mock_projects_for_user');
        // 重新查询
        const { data: refreshed } = await supabase
          .from('app_bd56170962_projects')
          .select('id, name, description, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(20);
        if (refreshed) {
          setProjects(
            refreshed.map((p) => ({
              sessionId: p.id,
              title: p.name || '未命名项目',
              description: p.description || '',
              updatedAt: formatRelativeTime(p.updated_at),
            }))
          );
        }
        return;
      }

      setProjects(
        data.map((p) => ({
          sessionId: p.id,
          title: p.name || '未命名项目',
          description: p.description || '',
          updatedAt: formatRelativeTime(p.updated_at),
        }))
      );
    };
    fetchProjects();
  }, [user]);

  /** 用户登出并重定向到登录页 */
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  /**
   * 开始构建新项目
   *
   * 业务流程：
   * 1. 校验输入非空且用户已登录
   * 2. 向 Supabase projects 表插入新记录（user_id + description）
   * 3. 获取数据库返回的 project UUID（即 session_id）
   * 4. 携带用户输入的 prompt 跳转到工作台页面
   *
   * 注意：此处不携带任何 AI 逻辑，纯粹是数据库插入 + 路由跳转
   */
  const handleStartBuild = async () => {
    if (!input.trim() || !user || creating) return;
    setCreating(true);

    // 从用户输入中提取项目名称：取第一行前 30 个字符作为名称
    const trimmedInput = input.trim();
    const projectName = trimmedInput.split('\n')[0].slice(0, 30) || '未命名项目';

    // 向 Supabase 插入新项目记录，获取自动生成的 UUID
    const { data, error } = await supabase
      .from('app_bd56170962_projects')
      .insert({
        user_id: user.id,
        name: projectName,
        description: trimmedInput,
      })
      .select('id')
      .single();

    if (error || !data) {
      setCreating(false);
      return;
    }

    // 使用返回的 project.id 作为 session_id 进行路由跳转
    navigate(`/project/${data.id}`, { state: { prompt: input.trim() } });
  };

  /**
   * 键盘事件处理
   * Enter 键触发构建（等同于点击按钮），Shift+Enter 换行
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartBuild();
    }
  };

  /** 点击项目列表项，跳转到对应工作台 */
  const handleProjectClick = (sessionId: string) => {
    navigate(`/project/${sessionId}`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex">
      {/* 左侧边栏 - 项目列表 */}
      <aside className="w-[280px] h-full border-r border-border/60 flex flex-col bg-card/50 flex-shrink-0">
        {/* 侧边栏顶部 - 品牌标识 */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">AI Workspace</span>
          </div>
        </div>

        {/* 项目列表区域 - 可滚动 */}
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

        {/* 底部用户信息区域 */}
        <div className="flex-shrink-0 border-t border-border/40 px-3 py-3">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-secondary border border-border/60 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs text-foreground/90 truncate">{user?.email}</p>
              </div>
            </button>
            {/* 用户操作弹窗菜单 */}
            {showUserMenu && (
              <div className="absolute left-0 bottom-full mb-1 w-full bg-card border border-border/80 rounded-lg shadow-lg py-1 z-50">
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
      </aside>

      {/* 主内容区域 - 项目需求输入 */}
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-[640px] space-y-8">
          {/* 引导区域 - 标题和描述 */}
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

          {/* 需求输入区域 */}
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
                  disabled={!input.trim() || creating}
                  size="sm"
                  className="h-8 px-4 gap-2 rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-30"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      开始构建
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 快速开始建议标签 */}
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