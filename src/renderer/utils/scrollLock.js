/**
 * scrollLock.js — prevent the main pane from scrolling while an overlay is
 * open. Reference-counted so stacked overlays don't unlock each other early.
 */
let count = 0;

export function lockScroll() {
  count += 1;
  if (typeof document !== 'undefined') document.body.classList.add('overlay-open');
}

export function unlockScroll() {
  count = Math.max(0, count - 1);
  if (count === 0 && typeof document !== 'undefined') {
    document.body.classList.remove('overlay-open');
  }
}
