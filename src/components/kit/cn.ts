// Minimal class-name joiner. No dependency on clsx/tailwind-merge so the kit
// stays portable — pass conditional classes as falsy values and they drop out.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
