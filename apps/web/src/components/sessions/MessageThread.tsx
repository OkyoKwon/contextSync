import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThemeStore } from '../../stores/theme.store';

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
        <MessageBubble key={'id' in message ? (message as { id: string }).id : index} message={message} />
      ))}
    </div>
  );
}

export function MessageBubble({ message }: { readonly message: DisplayMessage }) {
  const isUser = message.role === 'user';
  const theme = useThemeStore((s) => s.theme);

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
        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
