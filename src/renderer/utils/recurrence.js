/**
 * recurrence.js — renderer entry point for recurring-task helpers.
 *
 * The actual logic lives in `src/shared/recurrence.js` so the Electron main
 * process and the renderer share one implementation. This re-export keeps the
 * existing `../utils/recurrence` import path working for UI code.
 */
export { RECURRENCE_OPTIONS, recurrenceLabel, nextDueDate } from '../../shared/recurrence';
