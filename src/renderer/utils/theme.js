/**
 * theme.js — resolve and apply the color theme.
 *
 * Supports three stored preferences: 'dark', 'light', and 'system'. The
 * 'system' option follows the OS `prefers-color-scheme` and updates live when
 * the user switches their OS appearance.
 */

const mql = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

/** Resolve a stored preference to the concrete 'dark' | 'light' to render. */
export function resolveTheme(pref) {
  if (pref === 'system') {
    const m = mql();
    return m && m.matches ? 'dark' : 'light';
  }
  return pref === 'light' ? 'light' : 'dark';
}

let systemListener = null;

/**
 * Apply a theme preference to <html>. When the preference is 'system', a single
 * listener is attached so OS appearance changes update the app immediately;
 * switching away from 'system' detaches it. Safe to call repeatedly.
 */
export function applyTheme(pref) {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolveTheme(pref));

  const m = mql();
  if (!m) return;

  if (systemListener) {
    m.removeEventListener('change', systemListener);
    systemListener = null;
  }
  if (pref === 'system') {
    systemListener = () =>
      root.setAttribute('data-theme', m.matches ? 'dark' : 'light');
    m.addEventListener('change', systemListener);
  }
}
