import { diffLines, diffWords } from 'diff';

export type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

export function computeLineDiff(oldText: string, newText: string): DiffPart[] {
  return diffLines(oldText ?? '', newText ?? '');
}

export function computeWordDiff(oldText: string, newText: string): DiffPart[] {
  return diffWords(oldText ?? '', newText ?? '');
}
