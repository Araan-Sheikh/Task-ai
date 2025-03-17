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
  aiSuggestions?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    estimatedTime?: number;
    suggestedDeadline?: Date;
    dependencyRecommendations?: string[]; 
  };
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'postponed'; 