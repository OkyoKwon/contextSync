export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  // base ends with '/', path starts with '/' → avoid double slash
  return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
}
