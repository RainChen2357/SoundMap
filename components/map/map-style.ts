const OPENFREEMAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

/** OpenFreeMap styles are keyless and include their required map attribution. */
export function getSoundMapStyle(darkMode: boolean): string {
  return darkMode ? OPENFREEMAP_STYLES.dark : OPENFREEMAP_STYLES.light;
}
