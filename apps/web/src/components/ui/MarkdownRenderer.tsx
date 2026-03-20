import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThemeStore } from '../../stores/theme.store';

interface MarkdownRendererProps {
  readonly content: string;
  readonly className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div
      className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} ${className ?? ''}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
