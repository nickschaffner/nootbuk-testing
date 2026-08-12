/** Dev-only gate for calibration tools. */
export function isDevMode(): boolean {
  return import.meta.env.VITE_DEV_MODE === 'true'
}
