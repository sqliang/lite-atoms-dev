import { useState } from 'react';
import { Bot, User, Eye, Code, FileText, Image, ChevronDown, ChevronUp, FileEdit, FileInput, FilePlus2, Shuffle, Settings2 } from 'lucide-react';
import { useWorkspace, TabType } from '@/context/WorkspaceContext';

interface Attachment {
  id: string;
  title: string;
  type: TabType;
  content: string;
  language?: string;
}

/**
 * A step can be:
 * - A plain text string (rendered as a paragraph with a dot indicator)
 * - A file operation object (rendered as a clickable card)
 */
export type StepItem =
  | string
  | { type: 'file'; action: 'read' | 'write' | 'update'; file: string };

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: StepItem[];
  attachments?: Attachment[];
  timestamp: Date;
  version?: {
    label: string;
    description: string;
  };
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { openTab, findAndOpenFileByName } = useWorkspace();
  const isUser = message.role === 'user';
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const handlePreview = (attachment: Attachment) => {
    openTab({
      id: attachment.id,
      title: attachment.title,
      type: attachment.type,
      content: attachment.content,
      language: attachment.language,
    });
  };

  const handleFileClick = (file: string) => {
    // 1. First try to find the file in the project file tree (source of truth)
    const foundInTree = findAndOpenFileByName(file);
    if (foundInTree) return;

    // 2. Then try to find matching attachment by filename
    const matchingAttachment = message.attachments?.find(
      (att) => att.title === file || att.title.endsWith(file)
    );

    if (matchingAttachment) {
      openTab({
        id: matchingAttachment.id,
        title: matchingAttachment.title,
        type: matchingAttachment.type,
        content: matchingAttachment.content,
        language: matchingAttachment.language,
      });
      return;
    }

    // 3. Fallback: open with filename as tab with placeholder
    const ext = file.split('.').pop() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      css: 'css', json: 'json', html: 'html', md: 'markdown', yaml: 'yaml',
      py: 'python', go: 'go', rs: 'rust', png: 'text', jpg: 'text',
    };
    openTab({
      id: `file-${file}-${message.id}`,
      title: file,
      type: file.match(/\.(png|jpg|jpeg|gif|svg|webp)$/) ? 'image' : 'code',
      content: `// ${file}\n// This file was referenced in the workflow but its content is not available yet.`,
      language: langMap[ext] || 'typescript',
    });
  };

  const getAttachmentIcon = (type: TabType) => {
    switch (type) {
      case 'code':
        return <Code className="w-3.5 h-3.5" />;
      case 'image':
        return <Image className="w-3.5 h-3.5" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getFileActionIcon = (action: 'read' | 'write' | 'update') => {
    switch (action) {
      case 'read':
        return <FileInput className="w-4 h-4 text-blue-400" />;
      case 'write':
        return <FilePlus2 className="w-4 h-4 text-green-400" />;
      case 'update':
        return <FileEdit className="w-4 h-4 text-amber-400" />;
    }
  };

  const getFileActionLabel = (action: 'read' | 'write' | 'update') => {
    switch (action) {
      case 'read':
        return '读取文件';
      case 'write':
        return '写入文件';
      case 'update':
        return '更新文件';
    }
  };

  // User message - right aligned
  if (isUser) {
    return (
      <div className="flex gap-3 px-4 py-3 justify-end">
        <div className="flex flex-col items-end min-w-0 max-w-[80%]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs font-medium text-foreground/80">You</span>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl rounded-tr-sm px-3.5 py-2.5">
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Assistant message
  const steps = message.steps || [];
  const MAX_COLLAPSED_STEPS = 4;
  const hasMoreSteps = steps.length > MAX_COLLAPSED_STEPS;
  const visibleSteps = stepsExpanded ? steps : steps.slice(0, MAX_COLLAPSED_STEPS);

  const renderStep = (step: StepItem, index: number) => {
    if (typeof step === 'string') {
      // Text step - rendered as paragraph with dot indicator
      return (
        <div key={index} className="flex gap-3 items-start py-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
          <p className="text-[12px] text-foreground/70 leading-relaxed">{step}</p>
        </div>
      );
    }

    // File operation step - rendered as a clickable card
    return (
      <div
        key={index}
        className="flex items-center gap-3 px-3.5 py-2.5 my-1 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-border/80 transition-all duration-150 cursor-pointer group"
        onClick={() => handleFileClick(step.file)}
      >
        {getFileActionIcon(step.action)}
        <span className="text-[12px] text-muted-foreground/80 font-medium">
          {getFileActionLabel(step.action)}
        </span>
        <span className="text-[12px] text-foreground/80 font-mono group-hover:text-primary transition-colors">
          {step.file}
        </span>
        <Eye className="w-3 h-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/80">Coding Agent</span>
          <span className="text-[10px] text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Processing steps - collapsible workflow */}
        {steps.length > 0 && (
          <div className="space-y-0.5">
            {/* Workflow header */}
            <button
              onClick={() => setStepsExpanded(!stepsExpanded)}
              className="flex items-center gap-2 text-xs text-muted-foreground/80 hover:text-foreground/80 transition-colors cursor-pointer py-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="font-medium">工作流程</span>
              {stepsExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {!stepsExpanded && hasMoreSteps && (
                <span className="text-[10px] text-muted-foreground/50 ml-1">
                  ({steps.length} 步)
                </span>
              )}
            </button>

            {/* Steps content */}
            {stepsExpanded && (
              <div className="pl-1 border-l-2 border-border/30 ml-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {visibleSteps.map((step, index) => renderStep(step, index))}
              </div>
            )}
          </div>
        )}

        {/* Summary content */}
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Preview hint + Version card */}
        {message.version && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground/70">
              可以在 App Viewer 中查看效果。
            </p>
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
              <div>
                <p className="text-xs font-medium text-foreground/90">{message.version.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{message.version.description}</p>
              </div>
              <Shuffle className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </div>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.attachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => handlePreview(attachment)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/60 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">
                  {getAttachmentIcon(attachment.type)}
                </span>
                <span className="text-xs font-medium text-foreground/70 group-hover:text-foreground transition-colors truncate max-w-[120px]">
                  {attachment.title}
                </span>
                <Eye className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}