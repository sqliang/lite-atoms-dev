import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage, { ChatMessageData } from './ChatMessage';

interface Version {
  id: string;
  label: string;
  timestamp: Date;
}

const DEMO_VERSIONS: Version[] = [
  { id: 'v3', label: '版本 3', timestamp: new Date(Date.now() - 60000) },
  { id: 'v2', label: '版本 2', timestamp: new Date(Date.now() - 300000) },
  { id: 'v1', label: '版本 1', timestamp: new Date(Date.now() - 600000) },
];

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
    content:
      '已完成仪表盘组件的创建，包含响应式面积图和数据指标卡片。',
    steps: [
      '分析需求，确定组件结构',
      '创建 DashboardCard 组件',
      '实现 SVG 迷你图表',
      '添加响应式布局和主题适配',
    ],
    attachments: [
      {
        id: 'code-1',
        title: 'DashboardCard.tsx',
        type: 'code',
        language: 'typescript',
        content: `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';\nimport { TrendingUp } from 'lucide-react';\n\ninterface DashboardCardProps {\n  title: string;\n  value: string;\n  change: number;\n  data: number[];\n}\n\nexport function DashboardCard({ title, value, change, data }: DashboardCardProps) {\n  const max = Math.max(...data);\n  const min = Math.min(...data);\n  const range = max - min || 1;\n\n  const points = data\n    .map((d, i) => {\n      const x = (i / (data.length - 1)) * 200;\n      const y = 40 - ((d - min) / range) * 36;\n      return \`\${x},\${y}\`;\n    })\n    .join(' ');\n\n  return (\n    <Card className="hover:shadow-lg transition-shadow duration-300">\n      <CardHeader className="flex flex-row items-center justify-between pb-2">\n        <CardTitle className="text-sm font-medium text-muted-foreground">\n          {title}\n        </CardTitle>\n        <TrendingUp className={\`w-4 h-4 \${change >= 0 ? 'text-green-500' : 'text-red-500'}\`} />\n      </CardHeader>\n      <CardContent>\n        <div className="text-2xl font-bold">{value}</div>\n        <p className="text-xs text-muted-foreground mt-1">\n          {change >= 0 ? '+' : ''}{change}% from last month\n        </p>\n        <svg viewBox="0 0 200 44" className="w-full h-12 mt-3">\n          <polyline\n            fill="none"\n            stroke="currentColor"\n            strokeWidth="2"\n            className="text-primary"\n            points={points}\n          />\n        </svg>\n      </CardContent>\n    </Card>\n  );\n}`,
      },
      {
        id: 'doc-1',
        title: 'Usage Guide.md',
        type: 'document',
        content: `# DashboardCard Component\n\n## Overview\nA reusable dashboard card component that displays a metric with a sparkline chart.\n\n## Props\n| Prop | Type | Description |\n|------|------|-------------|\n| title | string | Card title label |\n| value | string | Main metric value |\n| change | number | Percentage change |\n| data | number[] | Chart data points |\n\n## Usage\n\n\`\`\`tsx\n<DashboardCard\n  title="Total Revenue"\n  value="$45,231.89"\n  change={20.1}\n  data={[10, 25, 18, 30, 28, 35, 42]}\n/>\n\`\`\``,
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
    content:
      '已生成现代风格的仪表盘 Hero 图片，采用深色渐变背景和抽象数据可视化元素。',
    steps: [
      '确定图片风格和配色方案',
      '生成深色渐变背景',
      '添加抽象数据可视化元素',
    ],
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

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessageData[]>(DEMO_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // TODO: Get project name from server based on session ID
  const projectName = 'Dashboard App';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessageData = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          '已根据你的需求完成代码生成和功能构建。',
        steps: [
          '解析用户需求',
          '设计组件结构',
          '生成代码实现',
          '验证功能完整性',
        ],
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          {/* TODO: Project name from server */}
          <span className="text-sm font-semibold text-foreground">{projectName}</span>
        </div>
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

          {/* Version dropdown */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && (
            <div className="flex gap-3 px-4 py-3 bg-secondary/30">
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

      {/* Input */}
      <div className="p-3 border-t border-border/60 flex-shrink-0">
        <div className="relative flex items-end gap-2 rounded-xl border border-border/80 bg-secondary/30 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你的需求..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none max-h-32"
            style={{ minHeight: '44px' }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="m-1.5 w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30 cursor-pointer transition-all duration-200"
          >
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          AI 可能产生不准确的信息，请验证重要细节。
        </p>
      </div>
    </div>
  );
}