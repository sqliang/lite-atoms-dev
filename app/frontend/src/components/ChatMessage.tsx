import { Bot, User, Eye, Code, FileText, Image } from 'lucide-react';
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

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? '' : 'bg-secondary/30'}`}>
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-primary/10 text-primary'
            : 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/80">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

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