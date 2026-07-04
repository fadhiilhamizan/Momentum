/**
 * types.d.ts — canonical data shapes for Momentum.
 *
 * A single source of truth for the Task/Project/Reflection/etc. shapes that are
 * otherwise re-declared implicitly across the SQLite mappers (database.js), the
 * localStorage mock (api.js), and the components. Reference from JS with JSDoc:
 *   `@param {import('../types').Task} task`
 *
 * This is the foundation for an incremental TypeScript migration: files opt in
 * with `// @ts-check` + JSDoc, and `npm run typecheck` enforces them.
 */

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Someday';
export type Energy = 'Low' | 'Medium' | 'High';
export type BestTime = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
export type RecurrencePattern =
  | ''
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'monthly-end'
  | null;

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  /** Optional due date (ISO). */
  dueDate?: string | null;
  /** Nested sub-steps. */
  children?: Subtask[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  priority: Priority;
  energyRequired: Energy;
  timeEstimate: number | null;
  bestTime: BestTime;
  /** ISO datetime; midnight time is treated as "date only". */
  dueDate: string | null;
  completedDate: string | null;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  isStarred: boolean;
  tags: string[];
  subtasks: Subtask[];
  /** Ids of the tasks this one is waiting on. */
  dependsOn: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reflection {
  id: string;
  /** yyyy-MM-dd */
  date: string;
  wins: string | null;
  learnings: string | null;
  tomorrow: string | null;
  /** Mood key ('rough'..'great'); legacy entries may hold an emoji. */
  mood: string | null;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  startDate: string | null;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  sound: boolean;
  notifications: boolean;
  weekStart: 0 | 1;
  timeFormat: '12h' | '24h';
  /** Minutes before a due time to fire a reminder (0 = at the due time). */
  reminderLead: number;
  onboarded?: boolean;
  lastBriefing?: string;
  [key: string]: unknown;
}
