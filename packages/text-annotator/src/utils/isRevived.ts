import type { TextSelector } from '../model';

export const isRevived = (selector: TextSelector[]) =>
  selector.every(s => s.range instanceof Range && !s.range.collapsed);
