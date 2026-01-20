
export interface User {
  id: string;
  username: string;
  password?: string; // Simples para persistência local
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
}

export interface CycleItem {
  id: string;
  subjectId: string;
  name: string;
  notebookUrl: string;
  completed: boolean;
  correct: number;
  wrong: number;
  hoursPerSession: number;
}

export enum Tab {
  SUBJECTS = 'subjects',
  CYCLE = 'cycle'
}
