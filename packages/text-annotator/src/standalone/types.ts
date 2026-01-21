/**
 * Core types for the standalone text annotation module.
 * These types are equivalent to those in @annotorious/core but defined locally
 * to ensure the standalone module has zero external dependencies.
 */

// ============================================
// Utility Types
// ============================================

export type Unsubscribe = () => void;

// ============================================
// Origin (for tracking where changes come from)
// ============================================

export type OriginType = 'LOCAL' | 'REMOTE';

export const Origin = {
  LOCAL: 'LOCAL' as const,
  REMOTE: 'REMOTE' as const
};

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  name?: string;
  avatar?: string;
  isGuest?: boolean;
}

// ============================================
// Selection Types
// ============================================

export type UserSelectAction = 'EDIT' | 'SELECT' | 'NONE';

export interface Selection {
  selected: { id: string; editable?: boolean }[];
  event?: PointerEvent | KeyboardEvent;
}

// ============================================
// Filter Type
// ============================================

export interface Filter<T = unknown> {
  (item: T): boolean;
}

// ============================================
// Annotation State
// ============================================

export interface AnnotationState {
  selected?: boolean;
  hovered?: boolean;
}

// ============================================
// Color/Style Types
// ============================================

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface DrawingStyle {
  fill?: string;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

// ============================================
// Simple Event Emitter (replaces nanoevents)
// ============================================

type EventCallback = (...args: any[]) => void;

export interface Emitter<Events extends Record<string, EventCallback>> {
  on<E extends keyof Events>(event: E, callback: Events[E]): Unsubscribe;
  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): void;
}

export const createEmitter = <Events extends Record<string, EventCallback>>(): Emitter<Events> => {
  const listeners: Map<keyof Events, Set<EventCallback>> = new Map();

  return {
    on<E extends keyof Events>(event: E, callback: Events[E]): Unsubscribe {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback);
      return () => {
        listeners.get(event)?.delete(callback);
      };
    },

    emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): void {
      listeners.get(event)?.forEach(callback => callback(...args));
    }
  };
};

// ============================================
// Options Types (subset of TextAnnotatorOptions)
// ============================================

export type UserSelectActionExpression<T = unknown> =
  | UserSelectAction
  | ((annotation: T) => UserSelectAction);

export type SelectionMode = 'single' | 'all';

export interface AnnotatorOptions<T = unknown> {
  annotatingEnabled?: boolean;
  userSelectAction?: UserSelectActionExpression<T>;
  selectionMode?: SelectionMode;
}
