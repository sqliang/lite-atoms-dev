import { useState } from 'react';
import { Bot, User, Eye, Code, FileText, Image, CheckCircle2, ChevronDown, ChevronUp, FileEdit, FileInput, FilePlus2, Shuffle } from 'lucide-react';
import { useWorkspace, TabType } from '@/context/WorkspaceContext';

interface Attachment {
  id: string;
  title: string;
  type: TabType;
  content: string;
  language?: string;
}

interface Step {
  label: string;
  action?: 'read' | 'write' | 'update';
  file?: string;
}

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: (string | Step)[];
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
  const { openTab } = useWorkspace();
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

  const handleStepClick = (step: string | Step) => {
    if (typeof step === 'object' && step.file) {
      // Open the file in workspace
      openTab({
        id: `file-${step.file}-${Date.now()}`,
        title: step.file,
        type: 'code',
        content: `// Content of ${step.file}\n// Loading...`,
        language: 'typescript',
      });
    }
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

  const getStepIcon = (step: string | Step) => {
    if (typeof step === 'object') {
      switch (step.action) {
        case 'read':
          return <FileInput className="w-3 h-3 text-blue-400 flex-shrink-0" />;
        case 'write':
          return <FilePlus2 className="w-3 h-3 text-green-400 flex-shrink-0" />;
        case 'update':
          return <FileEdit className="w-3 h-3 text-amber-400 flex-shrink-0" />;
        default:
          return <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />;
      }
    }
    return <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />;
  };

  const getStepLabel = (step: string | Step): string => {
    if (typeof step === 'string') return step;
    return step.label;
  };

  const isFileStep = (step: string | Step): boolean => {
    return typeof step === 'object' && !!step.file;
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

  // Assistant message - left aligned with steps
  const steps = message.steps || [];
  const MAX_COLLAPSED_STEPS = 3;
  const hasMoreSteps = steps.length > MAX_COLLAPSED_STEPS;
  const visibleSteps = stepsExpanded ? steps : steps.slice(0, MAX_COLLAPSED_STEPS);

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/80">Coding Agent</span>
          <span className="text-[10px] text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Processing steps - collapsible */}
        {steps.length > 0 && (
          <div className="bg-secondary/40 border border-border/40 rounded-lg px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                处理步骤 ({steps.length})
              </p>
              {hasMoreSteps && (
                <button
                  onClick={() => setStepsExpanded(!stepsExpanded)}
                  className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors cursor-pointer"
                >
                  {stepsExpanded ? (
                    <>
                      收起 <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      展开全部 <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
            {visibleSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 ${isFileStep(step) ? 'hover:bg-secondary/60 rounded px-1 -mx-1 cursor-pointer group' : ''}`}
                onClick={() => handleStepClick(step)}
              >
                {getStepIcon(step)}
                <span className={`text-[11px] text-foreground/70 ${isFileStep(step) ? 'group-hover:text-primary transition-colors' : ''}`}>
                  {getStepLabel(step)}
                </span>
                {isFileStep(step) && (
                  <Eye className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                )}
              </div>
            ))}
            {!stepsExpanded && hasMoreSteps && (
              <p className="text-[10px] text-muted-foreground/50 pl-5">
                还有 {steps.length - MAX_COLLAPSED_STEPS} 个步骤...
              </p>
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