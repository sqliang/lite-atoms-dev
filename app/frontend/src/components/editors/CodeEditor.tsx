import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('typescript', typescript);

interface CodeEditorProps {
  content: string;
  language?: string;
}

export default function CodeEditor({ content, language = 'typescript' }: CodeEditorProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = content;
      hljs.highlightElement(codeRef.current);
    }
  }, [content]);

  const lines = content.split('\n');

  return (
    <div className="h-full overflow-auto bg-[hsl(222,47%,5%)] workspace-enter">
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
              className={`language-${language} text-[13px] leading-[1.7rem] font-mono`}
            >
              {content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}