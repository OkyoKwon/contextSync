interface ScreenshotImageProps {
  readonly src: string;
  readonly alt: string;
  readonly fit?: 'cover' | 'contain';
  readonly className?: string;
}

export function ScreenshotImage({ src, alt, fit = 'cover', className = '' }: ScreenshotImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`rounded-lg object-${fit} ${className}`}
    />
  );
}
