export function isExternalApp(): boolean {
  return !!import.meta.env.VITE_APP_URL;
}
