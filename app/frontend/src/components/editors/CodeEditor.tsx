/**
 * @file CodeEditor.tsx
 * @description 代码编辑器组件 - 支持语法高亮和代码折叠
 *
 * 功能：
 * - 多语言语法高亮（TypeScript, JavaScript, CSS, JSON, HTML, YAML, Markdown, Bash）
 * - 代码块折叠/展开（基于花括号、方括号匹配）
 * - 行号显示
 * - 自动语言检测
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github-dark.css';
import { ChevronDown, ChevronRight } from 'lucide-react';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('bash', bash);

interface CodeEditorProps {
  content: string;
  language?: string;
}

/**
 * 折叠区域数据结构
 * @property startLine - 折叠区域起始行（0-indexed）
 * @property endLine - 折叠区域结束行（0-indexed）
 */
interface FoldRegion {
  startLine: number;
  endLine: number;
}

/**
 * 自动检测代码语言
 */
function detectLanguage(content: string, language?: string): string {
  if (language && language !== 'plaintext') return language;

  if (content.startsWith('{') || content.startsWith('[')) return 'json';
  if (content.includes('import ') && content.includes('from ')) return 'typescript';
  if (content.includes('function ') || content.includes('const ') || content.includes('=>')) return 'javascript';
  if (content.includes('<!DOCTYPE') || content.includes('<html')) return 'html';
  if (content.includes('selector') || (content.includes('{') && content.includes(':') && content.includes(';'))) return 'css';
  if (content.startsWith('---') || content.includes(':\n')) return 'yaml';
  if (content.startsWith('#') && content.includes('\n')) return 'markdown';

  return 'typescript';
}

/**
 * 计算可折叠区域
 * 通过匹配花括号 {} 和方括号 [] 来确定代码块边界
 * 只有跨越多行的代码块才会被标记为可折叠
 */
function computeFoldRegions(lines: string[]): FoldRegion[] {
  const regions: FoldRegion[] = [];
  // 栈中存储 { 或 [ 的起始行号
  const stack: { char: string; line: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '{' || ch === '[') {
        stack.push({ char: ch, line: i });
      } else if (ch === '}' || ch === ']') {
        const expected = ch === '}' ? '{' : '[';
        // 从栈顶匹配
        if (stack.length > 0 && stack[stack.length - 1].char === expected) {
          const start = stack.pop()!;
          // 只有跨越至少 2 行的块才可折叠
          if (i - start.line >= 2) {
            regions.push({ startLine: start.line, endLine: i });
          }
        }
      }
    }
  }

  return regions;
}

export default function CodeEditor({ content, language }: CodeEditorProps) {
  const codeRef = useRef<HTMLElement>(null);
  const detectedLang = detectLanguage(content, language);
  /** 当前被折叠的起始行集合 */
  const [collapsedLines, setCollapsedLines] = useState<Set<number>>(new Set());

  const lines = useMemo(() => content.split('\n'), [content]);

  /** 计算所有可折叠区域 */
  const foldRegions = useMemo(() => computeFoldRegions(lines), [lines]);

  /** 为每一行建立"该行是否为折叠起始行"的映射 */
  const foldableLineMap = useMemo(() => {
    const map = new Map<number, FoldRegion>();
    for (const region of foldRegions) {
      // 只保留最外层的折叠区域（同一行有多个时取最大范围）
      const existing = map.get(region.startLine);
      if (!existing || region.endLine > existing.endLine) {
        map.set(region.startLine, region);
      }
    }
    return map;
  }, [foldRegions]);

  /** 切换某行的折叠状态 */
  const toggleFold = (lineIndex: number) => {
    setCollapsedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineIndex)) {
        next.delete(lineIndex);
      } else {
        next.add(lineIndex);
      }
      return next;
    });
  };

  /** 计算哪些行应该被隐藏（被折叠的区域内的行） */
  const hiddenLines = useMemo(() => {
    const hidden = new Set<number>();
    for (const startLine of collapsedLines) {
      const region = foldableLineMap.get(startLine);
      if (region) {
        // 隐藏起始行之后到结束行之前的所有行
        for (let i = startLine + 1; i <= region.endLine; i++) {
          hidden.add(i);
        }
      }
    }
    return hidden;
  }, [collapsedLines, foldableLineMap]);

  /** 对每一行单独进行语法高亮 */
  const highlightedLines = useMemo(() => {
    return lines.map((line) => {
      if (!line.trim()) return '';
      try {
        const result = hljs.highlight(line, { language: detectedLang, ignoreIllegals: true });
        return result.value;
      } catch {
        return line;
      }
    });
  }, [lines, detectedLang]);

  // 整体高亮（用于无折叠时的备用方案，保留以确保样式正确加载）
  useEffect(() => {
    if (codeRef.current && collapsedLines.size === 0) {
      codeRef.current.removeAttribute('data-highlighted');
      codeRef.current.textContent = content;
      hljs.highlightElement(codeRef.current);
    }
  }, [content, detectedLang, collapsedLines.size]);

  // 如果没有折叠，使用整体高亮（效果更好）
  if (collapsedLines.size === 0) {
    return (
      <div className="h-full overflow-auto workspace-enter code-editor-container">
        <div className="flex min-h-full">
          {/* 折叠指示器 + 行号 */}
          <div className="flex-shrink-0 py-4 select-none code-editor-gutter flex">
            {/* 折叠按钮列 */}
            <div className="w-5 flex flex-col items-center">
              {lines.map((_, i) => {
                const isFoldable = foldableLineMap.has(i);
                return (
                  <div
                    key={i}
                    className="h-[1.7rem] flex items-center justify-center"
                  >
                    {isFoldable ? (
                      <button
                        onClick={() => toggleFold(i)}
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-secondary/60 transition-colors cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
                        title="折叠代码块"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {/* 行号列 */}
            <div className="px-2 text-right">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className="text-[11px] leading-[1.7rem] font-mono"
                  style={{ color: '#6e7681' }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* 代码内容 */}
          <div className="flex-1 overflow-x-auto">
            <pre className="py-4 px-4">
              <code
                ref={codeRef}
                className={`language-${detectedLang} text-[13px] leading-[1.7rem] font-mono`}
              >
                {content}
              </code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // 有折叠时，逐行渲染
  return (
    <div className="h-full overflow-auto workspace-enter code-editor-container">
      <div className="flex min-h-full">
        {/* 折叠指示器 + 行号 */}
        <div className="flex-shrink-0 py-4 select-none code-editor-gutter flex">
          {/* 折叠按钮列 */}
          <div className="w-5 flex flex-col items-center">
            {lines.map((_, i) => {
              if (hiddenLines.has(i)) return null;
              const isFoldable = foldableLineMap.has(i);
              const isCollapsed = collapsedLines.has(i);
              return (
                <div
                  key={i}
                  className="h-[1.7rem] flex items-center justify-center"
                >
                  {isFoldable ? (
                    <button
                      onClick={() => toggleFold(i)}
                      className="w-4 h-4 flex items-center justify-center rounded hover:bg-secondary/60 transition-colors cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
                      title={isCollapsed ? '展开代码块' : '折叠代码块'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {/* 行号列 */}
          <div className="px-2 text-right">
            {lines.map((_, i) => {
              if (hiddenLines.has(i)) return null;
              return (
                <div
                  key={i}
                  className="text-[11px] leading-[1.7rem] font-mono"
                  style={{ color: '#6e7681' }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* 代码内容（逐行渲染，支持折叠） */}
        <div className="flex-1 overflow-x-auto">
          <pre className="py-4 px-4">
            <code className={`language-${detectedLang} text-[13px] leading-[1.7rem] font-mono`}>
              {lines.map((_, i) => {
                if (hiddenLines.has(i)) return null;
                const isCollapsed = collapsedLines.has(i);
                const region = foldableLineMap.get(i);
                return (
                  <div key={i} data-line={i + 1} className="leading-[1.7rem]">
                    <span dangerouslySetInnerHTML={{ __html: highlightedLines[i] || '&nbsp;' }} />
                    {isCollapsed && region && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-secondary/80 text-muted-foreground cursor-pointer hover:bg-secondary transition-colors"
                        onClick={() => toggleFold(i)}
                      >
                        ⋯ {region.endLine - i} 行已折叠
                      </span>
                    )}
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}