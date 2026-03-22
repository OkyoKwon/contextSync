const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '');

export function appLink(path: string): string {
  return APP_URL ? `${APP_URL}${path}` : path;
}

export function isExternalApp(): boolean {
  return !!APP_URL;
}
