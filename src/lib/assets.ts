const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const version = process.env.NEXT_PUBLIC_VERSION ?? "";

/** URL of a file in `public/`, including the base path and a version stamp for fresh downloads after a deploy. */
export function asset(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) {
    return path;
  }
  const clean = path.replace(/^\/+/, "");
  return `${basePath}/${clean}${version ? `?v=${version}` : ""}`;
}

/** Address of a language page, e.g. `/WeddingInvitation/en/`. */
export function languagePath(code: string): string {
  return `${basePath}/${code}/`;
}
