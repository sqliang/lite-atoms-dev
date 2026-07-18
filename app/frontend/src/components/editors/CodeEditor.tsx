import { useEffect, useRef } from 'react';
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

function detectLanguage(content: string, language?: string): string {
  if (language && language !== 'plaintext') return language;
  
  // Auto-detect based on content patterns
  if (content.startsWith('{') || content.startsWith('[')) return 'json';
  if (content.includes('import ') && content.includes('from ')) return 'typescript';
  if (content.includes('function ') || content.includes('const ') || content.includes('=>')) return 'javascript';
  if (content.includes('<!DOCTYPE') || content.includes('<html')) return 'html';
  if (content.includes('selector') || content.includes('{') && content.includes(':') && content.includes(';')) return 'css';
  if (content.startsWith('---') || content.includes(':\n')) return 'yaml';
  if (content.startsWith('#') && content.includes('\n')) return 'markdown';
  
  return 'typescript';
}

export default function CodeEditor({ content, language }: CodeEditorProps) {
  const codeRef = useRef<HTMLElement>(null);
  const detectedLang = detectLanguage(content, language);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted');
      codeRef.current.textContent = content;
      hljs.highlightElement(codeRef.current);
    }
  }, [content, detectedLang]);

  const lines = content.split('\n');

  return (
    <div className="h-full overflow-auto bg-card workspace-enter">
      <div className="flex min-h-full">
        {/* Line numbers */}
        <div className="flex-shrink-0 py-4 px-3 text-right select-none border-r border-border/30">
          {lines.map((_, i) => (
            <div
              key={i}
              className="text-[11px] leading-[1.7rem] text-muted-foreground/40 font-mono"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code content */}
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