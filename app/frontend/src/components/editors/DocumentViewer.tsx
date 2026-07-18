import { useMemo } from 'react';

interface DocumentViewerProps {
  content: string;
  title: string;
}

function parseMarkdown(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-5 mb-2 text-foreground">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-secondary text-[12px] font-mono text-primary">$1</code>');

  // Code blocks
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre class="my-3 p-4 rounded-lg bg-secondary border border-border overflow-x-auto"><code class="text-[12px] font-mono text-foreground/80 leading-relaxed">$2</code></pre>'
  );

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match
      .split('|')
      .filter((c) => c.trim())
      .map((c) => c.trim());
    if (cells.every((c) => /^[-:]+$/.test(c))) {
      return '';
    }
    const isHeader = match.includes('---');
    const tag = isHeader ? 'th' : 'td';
    const cellClass =
      tag === 'th'
        ? 'px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40'
        : 'px-3 py-2 text-sm text-foreground/80 border-b border-border/20';
    const row = cells.map((c) => `<${tag} class="${cellClass}">${c}</${tag}>`).join('');
    return `<tr>${row}</tr>`;
  });

  html = html.replace(
    /(<tr>.*<\/tr>\n?)+/g,
    '<div class="my-4 overflow-x-auto rounded-lg border border-border/30"><table class="w-full">$&</table></div>'
  );

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="text-sm text-foreground/80 ml-4 list-disc">$1</li>');
  html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>');

  // Paragraphs
  html = html.replace(/^(?!<[hupltd]|<\/|<li|<ul|<pre|<div|<code|<table|<tr)(.+)$/gm, '<p class="text-sm text-foreground/80 leading-relaxed my-2">$1</p>');

  return html;
}

export default function DocumentViewer({ content, title }: DocumentViewerProps) {
  const renderedHtml = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="h-full overflow-auto bg-card workspace-enter">
      <div className="max-w-2xl mx-auto px-8 py-8">
        {/* Document title */}
        <div className="mb-6 pb-4 border-b border-border/30">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Markdown Document</p>
        </div>

        {/* Rendered content */}
        <div
          className="prose-sm"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}