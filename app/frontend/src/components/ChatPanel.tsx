import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage, { ChatMessageData } from './ChatMessage';

const DEMO_MESSAGES: ChatMessageData[] = [
  {
    id: '1',
    role: 'user',
    content: 'Help me create a React component for a dashboard card with a chart.',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    role: 'assistant',
    content:
      "I've created a dashboard card component with a responsive area chart. The component uses Tailwind CSS for styling and includes hover states. Here's the implementation:",
    attachments: [
      {
        id: 'code-1',
        title: 'DashboardCard.tsx',
        type: 'code',
        language: 'typescript',
        content: `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        id: 'doc-1',
        title: 'Usage Guide.md',
        type: 'document',
        content: `# DashboardCard Component

## Overview
A reusable dashboard card component that displays a metric with a sparkline chart.

## Props
| Prop | Type | Description |
|------|------|-------------|
| title | string | Card title label |
| value | string | Main metric value |
| change | number | Percentage change |
| data | number[] | Chart data points |

## Usage

\`\`\`tsx
<DashboardCard
  title="Total Revenue"
  value="$45,231.89"
  change={20.1}
  data={[10, 25, 18, 30, 28, 35, 42]}
/>
\`\`\`

## Styling
The component uses Tailwind CSS and shadcn/ui Card components. It includes:
- Hover shadow animation
- Responsive SVG sparkline
- Color-coded trend indicator
`,
      },
    ],
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you also generate a hero image for the dashboard?',
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: '4',
    role: 'assistant',
    content:
      "I've generated a modern dashboard hero image with a dark gradient background and abstract data visualization elements. You can preview it in the workspace:",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
          "I understand your request. Let me work on that for you. I'll generate the code and assets you need.",
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
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer">
          <Plus className="w-4 h-4" />
        </Button>
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
            placeholder="Ask AI anything..."
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
          AI may produce inaccurate information. Verify important details.
        </p>
      </div>
    </div>
  );
}