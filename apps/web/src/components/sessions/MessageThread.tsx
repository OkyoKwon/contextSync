import { useCollapsible } from '@/hooks/use-collapsible';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

export interface DisplayMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly modelUsed?: string | null;
}

interface MessageThreadProps {
  readonly messages: readonly DisplayMessage[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={'id' in message ? (message as { id: string }).id : index}
          message={message}
        />
      ))}
    </div>
  );
}

export function MessageBubble({ message }: { readonly message: DisplayMessage }) {
  const isUser = message.role === 'user';
  const { contentRef, isCollapsed, needsCollapse, toggle } = useCollapsible();

  const gradientColor = isUser
    ? 'from-blue-600/0 to-blue-600'
    : 'from-transparent to-[var(--color-surface)]';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'border border-border-default bg-surface text-text-primary'
        }`}
      >
        <div className="mb-1 text-xs font-medium opacity-70">
          {isUser ? 'You' : 'Claude'}
          {message.modelUsed && !isUser && (
            <span className="ml-1 opacity-50">({message.modelUsed})</span>
          )}
        </div>
        <div className="relative">
          <div
            ref={contentRef}
            className={needsCollapse && isCollapsed ? 'max-h-[300px] overflow-hidden' : ''}
          >
            <MarkdownRenderer content={message.content} />
          </div>
          {needsCollapse && isCollapsed && (
            <div
              className={`pointer-events-none absolute bottom-0 left-0 h-16 w-full bg-gradient-to-b ${gradientColor}`}
            />
          )}
        </div>
        {needsCollapse && (
          <button
            onClick={toggle}
            className={`mt-2 flex items-center gap-1 text-xs ${
              isUser
                ? 'text-blue-200 hover:text-white'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {isCollapsed ? '더 보기' : '접기'}
            <svg
              className={`h-3 w-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
