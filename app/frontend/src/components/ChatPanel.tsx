/**
 * @file ChatPanel.tsx
 * @description AI 对话面板组件
 *
 * 该组件实现了工作台左侧的 AI 聊天界面，包含：
 * - 顶部导航栏：返回首页按钮、项目名称、版本历史
 * - 消息列表区域：展示用户消息和 AI 回复（含工作流步骤）
 * - 底部输入区域：支持多行输入、自动高度调整、快捷键发送
 *
 * 当前阶段为 Demo 模式，消息数据为模拟数据。
 * 后续将接入真实 AI 后端，通过 WebSocket/SSE 实现流式响应。
 *
 * 核心交互：
 * - Enter 发送消息，Shift+Enter 换行
 * - 滚动到底部按钮（当用户向上滚动时显示）
 * - 版本历史下拉菜单
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, History, ArrowDown, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ChatMessage, { ChatMessageData, StepItem } from './ChatMessage';

/**
 * 版本记录数据结构
 * 每次 AI 完成一轮代码生成后会产生一个新版本
 */
interface Version {
  id: string;
  label: string;
  timestamp: Date;
}

/** Demo 版本历史数据 */
const DEMO_VERSIONS: Version[] = [
  { id: 'v3', label: '版本 3', timestamp: new Date(Date.now() - 60000) },
  { id: 'v2', label: '版本 2', timestamp: new Date(Date.now() - 300000) },
  { id: 'v1', label: '版本 1', timestamp: new Date(Date.now() - 600000) },
];

/**
 * Demo 消息数据
 * 模拟用户与 AI 的对话历史，展示各种消息类型：
 * - 纯文本用户消息
 * - 带工作流步骤的 AI 回复
 * - 带代码附件的 AI 回复
 * - 带图片附件的 AI 回复
 */
const DEMO_MESSAGES: ChatMessageData[] = [
  {
    id: '1',
    role: 'user',
    content: '帮我创建一个 React 仪表盘组件，包含数据图表和指标卡片。',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    role: 'assistant',
    content: '已完成仪表盘组件的创建，包含响应式面积图和数据指标卡片。',
    steps: [
      'I\'m getting started.',
      '正在处理图片附件...',
      '已成功处理 1 个图片附件。',
      { type: 'file', action: 'read', file: 'package.json' },
      { type: 'file', action: 'read', file: 'App.tsx' },
      'Let me implement the dashboard components. I\'ll create the card and chart widgets:',
      { type: 'file', action: 'write', file: 'DashboardCard.tsx' },
      { type: 'file', action: 'write', file: 'ChartWidget.tsx' },
      'Now update the main app to integrate the new components:',
      { type: 'file', action: 'update', file: 'App.tsx' },
      { type: 'file', action: 'update', file: 'index.css' },
    ] as StepItem[],
    version: {
      label: '版本 2',
      description: '新增仪表盘组件',
    },
    attachments: [
      {
        id: 'code-chart',
        title: 'ChartWidget.tsx',
        type: 'code',
        language: 'typescript',
        content: `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartWidgetProps {
  title: string;
  data: number[];
}

export function ChartWidget({ title, data }: ChartWidgetProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 300;
  const height = 120;
  const padding = 20;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d - min) / range) * (height - 2 * padding);
      return \`\${x},\${y}\`;
    })
    .join(' ');

  const areaPoints = \`\${padding},\${height - padding} \${points} \${width - padding},\${height - padding}\`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={\`0 0 \${width} \${height}\`} className="w-full">
          <polygon fill="currentColor" className="text-primary/10" points={areaPoints} />
          <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" points={points} />
        </svg>
      </CardContent>
    </Card>
  );
}`,
      },
      {
        id: 'code-1',
        title: 'DashboardCard.tsx',
        type: 'code',
        language: 'typescript',
        content: `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';\nimport { TrendingUp } from 'lucide-react';\n\ninterface DashboardCardProps {\n  title: string;\n  value: string;\n  change: number;\n  data: number[];\n}\n\nexport function DashboardCard({ title, value, change, data }: DashboardCardProps) {\n  const max = Math.max(...data);\n  const min = Math.min(...data);\n  const range = max - min || 1;\n\n  const points = data\n    .map((d, i) => {\n      const x = (i / (data.length - 1)) * 200;\n      const y = 40 - ((d - min) / range) * 36;\n      return \`\${x},\${y}\`;\n    })\n    .join(' ');\n\n  return (\n    <Card className="hover:shadow-lg transition-shadow duration-300">\n      <CardHeader className="flex flex-row items-center justify-between pb-2">\n        <CardTitle className="text-sm font-medium text-muted-foreground">\n          {title}\n        </CardTitle>\n        <TrendingUp className={\`w-4 h-4 \${change >= 0 ? 'text-green-500' : 'text-red-500'}\`} />\n      </CardHeader>\n      <CardContent>\n        <div className="text-2xl font-bold">{value}</div>\n        <p className="text-xs text-muted-foreground mt-1">\n          {change >= 0 ? '+' : ''}{change}% from last month\n        </p>\n        <svg viewBox="0 0 200 44" className="w-full h-12 mt-3">\n          <polyline\n            fill="none"\n            stroke="currentColor"\n            strokeWidth="2"\n            className="text-primary"\n            points={points}\n          />\n        </svg>\n      </CardContent>\n    </Card>\n  );\n}`,
      },
    ],
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    role: 'user',
    content: '再帮我生成一张仪表盘的 Hero 图片。',
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: '4',
    role: 'assistant',
    content: '已生成现代风格的仪表盘 Hero 图片，采用深色渐变背景和抽象数据可视化元素。',
    steps: [
      '确定图片风格和配色方案，采用深色渐变背景搭配抽象数据可视化元素。',
      { type: 'file', action: 'read', file: 'theme.config.ts' },
      '正在生成深色渐变背景和抽象数据可视化元素...',
      { type: 'file', action: 'write', file: 'hero-banner.png' },
      'Now update the homepage to use the generated hero image:',
      { type: 'file', action: 'update', file: 'HomePage.tsx' },
    ] as StepItem[],
    version: {
      label: '版本 3',
      description: '功能优化完成',
    },
    attachments: [
      {
        id: 'img-1',
        title: 'dashboard-hero.png',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
      },
    ],
    timestamp: new Date(Date.now() - 120000),
  },
];

/**
 * ChatPanel 组件 Props
 * @property projectName - 从 Supabase 获取的项目名称（可选，加载中时为 undefined）
 * @property projectDescription - 从 Supabase 获取的项目描述（可选）
 */
interface ChatPanelProps {
  projectName?: string;
  projectDescription?: string;
}

export default function ChatPanel({ projectName: propProjectName, projectDescription: _projectDescription }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>(DEMO_MESSAGES);
  const [input, setInput] = useState('');
  /** AI 正在生成回复的状态 */
  const [isTyping, setIsTyping] = useState(false);
  /** 版本历史下拉菜单的显示状态 */
  const [showVersions, setShowVersions] = useState(false);
  /** 滚动到底部按钮的显示状态 */
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  /** 项目名称：优先使用从 Supabase 获取的名称，加载中时显示占位文本 */
  const projectName = propProjectName || '加载中...';

  /** 新消息到达时自动滚动到底部 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 监听消息列表滚动位置
   * 当用户向上滚动超过 80px 时显示"滚动到底部"按钮
   */
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollButton(!isNearBottom);
  }, []);

  /** 平滑滚动到消息列表底部 */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * 发送用户消息
   * 当前为 Demo 模式，模拟 AI 延迟 1.5 秒后回复
   * 后续将替换为真实 API 调用
   */
  const handleSend = () => {
    if (!input.trim()) return;

    // 构造用户消息对象
    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // 模拟 AI 响应（Demo 模式）
    setTimeout(() => {
      const aiMessage: ChatMessageData = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '已根据你的需求完成代码生成和功能构建。',
        steps: [
          'I\'m getting started.',
          '正在处理用户需求...',
          { type: 'file', action: 'read', file: 'App.tsx' },
          'Let me create the component based on your requirements:',
          { type: 'file', action: 'write', file: 'Component.tsx' },
          'Now integrating the component into the app:',
          { type: 'file', action: 'update', file: 'App.tsx' },
          '验证功能完整性，所有测试通过。',
        ] as StepItem[],
        version: {
          label: '版本 4',
          description: '新增功能组件',
        },
        attachments: [
          {
            id: `code-${Date.now()}`,
            title: 'Component.tsx',
            type: 'code',
            language: 'typescript',
            content: `// Generated component based on your request\nimport React from 'react';\n\nexport function GeneratedComponent() {\n  return (\n    <div className="p-6 rounded-xl bg-card border">\n      <h2 className="text-lg font-semibold">Generated Content</h2>\n      <p className="text-muted-foreground mt-2">\n        This component was generated based on your requirements.\n      </p>\n    </div>\n  );\n}`,
          },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  /**
   * 键盘事件处理
   * Enter 发送消息，Shift+Enter 插入换行
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* 返回首页按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 cursor-pointer"
            onClick={() => navigate('/')}
            title="返回首页"
          >
            <Home className="w-4 h-4" />
          </Button>
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">{projectName}</span>
        </div>
        {/* 版本历史按钮 */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 cursor-pointer"
            onClick={() => setShowVersions(!showVersions)}
            title="版本历史"
          >
            <History className="w-4 h-4" />
          </Button>

          {/* 版本历史下拉菜单 */}
          {showVersions && (
            <div className="absolute right-0 top-9 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium px-3 py-1.5">
                版本历史
              </p>
              {DEMO_VERSIONS.map((version) => (
                <button
                  key={version.id}
                  className="w-full text-left px-3 py-2 hover:bg-secondary/60 transition-colors text-xs flex items-center justify-between cursor-pointer"
                  onClick={() => setShowVersions(false)}
                >
                  <span className="font-medium text-foreground/90">{version.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {version.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 消息列表区域 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto relative"
        onScroll={handleScroll}
      >
        <div className="py-2">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {/* AI 正在输入的动画指示器 */}
          {isTyping && (
            <div className="flex gap-3 px-4 py-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="flex items-center gap-1 pt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 滚动到底部浮动按钮 */}
      {showScrollButton && (
        <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-40">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full shadow-lg border border-border/60 cursor-pointer hover:bg-primary/10 transition-all duration-200"
            onClick={scrollToBottom}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 底部消息输入区域 */}
      <div className="p-3 border-t border-border/60 flex-shrink-0">
        <div className="rounded-xl border border-border/80 bg-secondary/30 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
          {/* 多行文本输入框，支持自动高度调整 */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // 自动调整 textarea 高度以适应内容
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 200) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="描述你的需求..."
            rows={2}
            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            style={{ minHeight: '56px', maxHeight: '200px' }}
          />
          {/* 工具栏 - 发送按钮 */}
          <div className="flex items-center justify-end px-3 pb-2">
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30 cursor-pointer transition-all duration-200"
            >
              <Send className="w-3.5 h-3.5 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}