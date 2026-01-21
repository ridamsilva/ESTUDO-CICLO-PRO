
export interface User {
  id: string;
  username: string;
  password?: string;
}

export interface Subject {
  id: string;
  name: string;
  notebookUrl: string;
  totalHours: number;
  frequency: number;
  isActive: boolean;
  totalCorrect: number;
  totalWrong: number;
  created_at?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  details?: string;
  type: 'status' | 'performance' | 'link' | 'system';
}

export interface CycleItem {
  id: string;
  subjectId: string;
  name: string;
  notebookUrl: string;
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
  correct: number;
  wrong: number;
  hoursPerSession: number;
  history?: HistoryEntry[];
}

export enum Tab {
  SUBJECTS = 'subjects',
  CYCLE = 'cycle'
}
