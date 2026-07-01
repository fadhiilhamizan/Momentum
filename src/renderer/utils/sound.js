/**
 * sound.js — tiny WebAudio chimes, generated on the fly so there are no audio
 * assets to bundle. Playback is gated by the user's "sound" setting.
 */
import { useUserStore } from '../store/userStore';

let ctx = null;
function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function soundEnabled() {
  const s = useUserStore.getState().settings;
  return s.sound !== false; // default on
}

function tone(freq, start, duration, gain = 0.06) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** A soft two-note rising chime for task completion. */
export function playChime() {
  if (!soundEnabled()) return;
  try {
    const ac = audio();
    if (ac && ac.state === 'suspended') ac.resume();
    tone(660, 0, 0.18); // E5
    tone(880, 0.09, 0.28); // A5
  } catch (_) {
    /* audio not available */
  }
}

/** A brighter three-note flourish for milestones. */
export function playFanfare() {
  if (!soundEnabled()) return;
  try {
    const ac = audio();
    if (ac && ac.state === 'suspended') ac.resume();
    tone(523, 0, 0.16); // C5
    tone(659, 0.1, 0.16); // E5
    tone(784, 0.2, 0.34); // G5
  } catch (_) {
    /* audio not available */
  }
}
