export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'postponed';
  category: string;
  dueDate?: Date;
  estimatedTime?: number; 
  actualTime?: number; 
  completionPercentage?: number; 
  aiGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
  dependencies?: string[]; 
  pomodorosCompleted?: number; 
  productivityScore?: number; 
  tags?: string[];
  subtasks?: SubTask[];
  notes?: Note[];
  recurring?: RecurringPattern;
  parentTaskId?: string;
  aiSuggestions?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    estimatedTime?: number;
    suggestedDeadline?: Date;
    dependencyRecommendations?: string[];
    reason?: string; // Reason for recommending the task or specific suggestion
  };
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endDate?: Date;
  endAfterOccurrences?: number;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number;
  monthOfYear?: number;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'postponed'; 