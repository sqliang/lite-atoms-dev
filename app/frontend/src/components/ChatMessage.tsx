/**
 * @file ChatMessage.tsx
 * @description 聊天消息组件 - 渲染单条对话消息
 *
 * 该组件负责渲染两种类型的消息：
 *
 * 1. 用户消息（右对齐气泡样式）：
 *    - 显示用户头像、时间戳、消息内容
 *
 * 2. AI 助手消息（左对齐，包含丰富结构）：
 *    - 工作流步骤（可折叠）：展示 AI 的思考和操作过程
 *      - 文本步骤：纯文字描述
 *      - 文件操作步骤：read/write/update，可点击打开文件
 *    - 摘要内容：AI 的最终回复文本
 *    - 版本卡片：标记代码版本，可切换
 *    - 附件列表：代码文件、图片等，可点击在编辑器中打开
 *
 * 文件点击的查找优先级：
 * 1. 项目文件树中按文件名搜索
 * 2. 当前消息的附件列表中匹配
 * 3. 兜底：创建占位标签页
 */

import { useState } from 'react';
import { Bot, User, Eye, Code, FileText, Image, ChevronDown, ChevronUp, FileEdit, FileInput, FilePlus2, Shuffle, Settings2 } from 'lucide-react';
import { useWorkspace, TabType } from '@/context/WorkspaceContext';

/**
 * 附件数据结构
 * 代表 AI 生成的代码文件、图片等可预览资源
 */
interface Attachment {
  id: string;
  title: string;
  type: TabType;
  content: string;
  language?: string;
}

/**
 * 工作流步骤类型（联合类型）
 * - string: 纯文本描述步骤（如"正在分析需求..."）
 * - object: 文件操作步骤，包含操作类型和文件名
 */
export type StepItem =
  | string
  | { type: 'file'; action: 'read' | 'write' | 'update'; file: string };

/**
 * 聊天消息数据结构
 * @property id - 消息唯一标识
 * @property role - 消息发送者角色：user（用户）或 assistant（AI）
 * @property content - 消息文本内容
 * @property steps - AI 的工作流步骤列表（仅 assistant 消息）
 * @property attachments - 附件列表（代码、图片等）
 * @property timestamp - 消息发送时间
 * @property version - 关联的代码版本信息
 */
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
  /** 生成中的消息默认展开工作流步骤，让用户实时看到生成过程 */
  defaultExpanded?: boolean;
}

export default function ChatMessage({ message, defaultExpanded = false }: ChatMessageProps) {
  const { openTab, findAndOpenFileByName } = useWorkspace();
  const isUser = message.role === 'user';
  /** 工作流步骤区域的展开/折叠状态 */
  const [stepsExpanded, setStepsExpanded] = useState(defaultExpanded);

  /**
   * 打开附件到编辑器标签页
   * 将附件内容作为新标签页在右侧编辑器中展示
   */
  const handlePreview = (attachment: Attachment) => {
    openTab({
      id: attachment.id,
      title: attachment.title,
      type: attachment.type,
      content: attachment.content,
      language: attachment.language,
    });
  };

  /**
   * 处理文件点击事件
   * 按优先级查找并打开文件：
   * 1. 在项目文件树中递归搜索（最准确）
   * 2. 在当前消息附件中匹配文件名
   * 3. 兜底创建占位标签页
   */
  const handleFileClick = (file: string) => {
    // 优先级 1：在项目文件树中查找（真实文件按需异步加载内容）
    void findAndOpenFileByName(file).then((foundInTree) => {
      if (foundInTree) return;

      // 优先级 2：在当前消息的附件中查找
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

      // 优先级 3：兜底 - 创建占位标签页
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
    });
  };

  /** 根据附件类型返回对应图标 */
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

  /** 根据文件操作类型返回对应彩色图标 */
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

  /** 根据文件操作类型返回中文标签 */
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

  // ========== 用户消息渲染（右对齐气泡） ==========
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

  // ========== AI 助手消息渲染 ==========
  const steps = message.steps || [];
  /** 折叠状态下最多显示的步骤数 */
  const MAX_COLLAPSED_STEPS = 4;
  const hasMoreSteps = steps.length > MAX_COLLAPSED_STEPS;
  const visibleSteps = stepsExpanded ? steps : steps.slice(0, MAX_COLLAPSED_STEPS);

  /**
   * 渲染单个工作流步骤
   * 根据步骤类型（文本/文件操作）渲染不同的 UI
   */
  const renderStep = (step: StepItem, index: number) => {
    if (typeof step === 'string') {
      // 文本步骤 - 带圆点指示器的段落
      return (
        <div key={index} className="flex gap-3 items-start py-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
          <p className="text-[12px] text-foreground/70 leading-relaxed">{step}</p>
        </div>
      );
    }

    // 文件操作步骤 - 可点击的卡片
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
      {/* AI 头像 */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {/* 角色名称和时间戳 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/80">Coding Agent</span>
          <span className="text-[10px] text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* 工作流步骤区域（可折叠） */}
        {steps.length > 0 && (
          <div className="space-y-0.5">
            {/* 折叠/展开切换按钮 */}
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

            {/* 步骤内容列表 */}
            {stepsExpanded && (
              <div className="pl-1 border-l-2 border-border/30 ml-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {visibleSteps.map((step, index) => renderStep(step, index))}
              </div>
            )}
          </div>
        )}

        {/* AI 回复摘要文本 */}
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* 版本卡片 + 预览提示 */}
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

        {/* 附件列表 - 可点击在编辑器中打开 */}
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