import { useState } from 'react';

interface ScreenshotImageProps {
  readonly src: string;
  readonly alt: string;
  readonly fit?: 'cover' | 'contain';
  readonly className?: string;
}

const fitClasses = { cover: 'object-cover', contain: 'object-contain' } as const;

export function ScreenshotImage({ src, alt, fit = 'cover', className = '' }: ScreenshotImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-surface-hover text-text-muted aspect-video ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={`rounded-lg ${fitClasses[fit]} ${className}`}
    />
  );
}
