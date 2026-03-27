import type { LearningResource } from '@context-sync/shared';
import type { EvalContentLang } from './EvalLanguageToggle';

interface LearningResourceItemProps {
  resource: LearningResource;
  contentLang?: EvalContentLang;
}

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  video: { icon: '▶', label: 'Video' },
  article: { icon: '◇', label: 'Article' },
  documentation: { icon: '□', label: 'Docs' },
  tutorial: { icon: '◈', label: 'Tutorial' },
  course: { icon: '◎', label: 'Course' },
  tool: { icon: '⚙', label: 'Tool' },
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

export function LearningResourceItem({ resource, contentLang = 'en' }: LearningResourceItemProps) {
  const isKo = contentLang === 'ko';
  const title = isKo ? (resource.titleKo ?? resource.title) : resource.title;
  const description = isKo
    ? (resource.descriptionKo ?? resource.description)
    : resource.description;

  const typeInfo = TYPE_LABELS[resource.type] ?? { icon: '•', label: resource.type };
  const levelColor = LEVEL_COLORS[resource.level] ?? 'bg-surface-secondary text-text-tertiary';

  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0 text-text-tertiary">{typeInfo.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-medium text-blue-400 hover:text-blue-300 hover:underline"
          >
            {title}
          </a>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${levelColor}`}
          >
            {resource.level}
          </span>
          {resource.estimatedMinutes != null && (
            <span className="shrink-0 text-text-tertiary">{resource.estimatedMinutes}min</span>
          )}
        </div>
        <p className="mt-0.5 text-text-tertiary">{description}</p>
      </div>
    </li>
  );
}
