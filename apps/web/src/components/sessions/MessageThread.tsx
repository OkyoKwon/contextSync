import type { Message } from '@context-sync/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageThreadProps {
  messages: readonly Message[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'border border-gray-200 bg-white text-gray-900'
        }`}
      >
        <div className="mb-1 text-xs font-medium opacity-70">
          {isUser ? 'You' : 'Claude'}
          {message.modelUsed && !isUser && (
            <span className="ml-1 opacity-50">({message.modelUsed})</span>
          )}
        </div>
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
