/**
 * @file ModeSelect.tsx
 * @description Build/Plan 执行模式选择器
 *
 * 贴在发送按钮左侧使用：
 * - Build（默认）：Planner 产出 Contract 后自动批准，直接生成代码
 * - Plan：Planner 产出 Contract 后暂停，用户在会话中审阅/编辑并手动批准
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Hammer, ClipboardList } from 'lucide-react';

export type RunMode = 'build' | 'plan';

const MODE_META: Record<RunMode, { label: string; hint: string; icon: typeof Hammer }> = {
  build: { label: 'Build', hint: '自动批准计划，直接生成代码', icon: Hammer },
  plan: { label: 'Plan', hint: '先审阅并编辑计划，批准后生成', icon: ClipboardList },
};

interface ModeSelectProps {
  mode: RunMode;
  onChange: (mode: RunMode) => void;
  disabled?: boolean;
}

export function ModeSelect({ mode, onChange, disabled }: ModeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /** 点击菜单外任意位置自动收起 */
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const CurrentIcon = MODE_META[mode].icon;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-8 px-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer disabled:opacity-40"
        title={MODE_META[mode].hint}
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        {MODE_META[mode].label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1.5 right-0 w-52 bg-card border border-border rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-bottom-1 duration-150">
          {(Object.keys(MODE_META) as RunMode[]).map((candidate) => {
            const meta = MODE_META[candidate];
            const Icon = meta.icon;
            return (
              <button
                key={candidate}
                type="button"
                className={`w-full text-left px-3 py-2 transition-colors cursor-pointer ${
                  candidate === mode ? 'bg-primary/10' : 'hover:bg-secondary/60'
                }`}
                onClick={() => {
                  onChange(candidate);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2 text-xs font-medium text-foreground/90">
                  <Icon className="w-3.5 h-3.5" />
                  {meta.label} 模式
                </span>
                <span className="block mt-0.5 text-[10px] text-muted-foreground">{meta.hint}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
