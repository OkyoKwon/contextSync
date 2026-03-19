export function validateProjectName(name: string): {
  readonly valid: boolean;
  readonly error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }
  if (name.length > 255) {
    return { valid: false, error: 'Project name must be 255 characters or less' };
  }
  return { valid: true };
}

export function validateRepoUrl(url: string): {
  readonly valid: boolean;
  readonly error?: string;
} {
  if (!url) {
    return { valid: true };
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Repository URL must use http or https' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid repository URL format' };
  }
}
