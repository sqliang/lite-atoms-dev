import { Bot, User, Eye, Code, FileText, Image, CheckCircle2 } from 'lucide-react';
import { useWorkspace, TabType } from '@/context/WorkspaceContext';

interface Attachment {
  id: string;
  title: string;
  type: TabType;
  content: string;
  language?: string;
}

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: string[];
  attachments?: Attachment[];
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { openTab } = useWorkspace();
  const isUser = message.role === 'user';

  const handlePreview = (attachment: Attachment) => {
    openTab({
      id: attachment.id,
      title: attachment.title,
      type: attachment.type,
      content: attachment.content,
      language: attachment.language,
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

        {/* Processing steps */}
        {message.steps && message.steps.length > 0 && (
          <div className="bg-secondary/40 border border-border/40 rounded-lg px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium mb-1">
              处理步骤
            </p>
            {message.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-[11px] text-foreground/70">{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Summary content */}
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

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