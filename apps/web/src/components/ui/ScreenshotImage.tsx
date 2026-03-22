interface ScreenshotImageProps {
  readonly src: string;
  readonly alt: string;
  readonly fit?: 'cover' | 'contain';
  readonly className?: string;
}

const fitClasses = { cover: 'object-cover', contain: 'object-contain' } as const;

export function ScreenshotImage({ src, alt, fit = 'cover', className = '' }: ScreenshotImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`rounded-lg ${fitClasses[fit]} ${className}`}
    />
  );
}
