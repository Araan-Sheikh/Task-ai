import { v4 as uuidv4 } from 'uuid';
import { Task, TaskCategory, PriorityLevel } from '../models/Task';

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'work', name: 'Work', color: '#FF5733' },
  { id: 'personal', name: 'Personal', color: '#33FF57' },
  { id: 'learning', name: 'Learning', color: '#3357FF' },
  { id: 'health', name: 'Health', color: '#F033FF' },
  { id: 'errands', name: 'Errands', color: '#FF9F33' },
];

export class TaskService {
  private static STORAGE_KEY = 'ai-task-manager-tasks';
  private static CATEGORIES_KEY = 'ai-task-manager-categories';
  
  static getTasks(): Task[] {
    const tasksJson = localStorage.getItem(this.STORAGE_KEY);
    if (!tasksJson) return [];
    
    const tasks = JSON.parse(tasksJson) as Task[];
    
    return tasks.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      aiSuggestions: task.aiSuggestions ? {
        ...task.aiSuggestions,
        suggestedDeadline: task.aiSuggestions.suggestedDeadline 
          ? new Date(task.aiSuggestions.suggestedDeadline) 
          : undefined
      } : undefined
    }));
  }
  
  static saveTasks(tasks: Task[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  }
  
  static addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const tasks = this.getTasks();
    const now = new Date();
    
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    
    this.saveTasks([...tasks, newTask]);
    return newTask;
  }
  
  static updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) return null;
    
    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    
    return updatedTask;
  }
  
  static deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== id);
    
    if (filteredTasks.length === tasks.length) return false;
    
    this.saveTasks(filteredTasks);
    return true;
  }
  
  static getCategories(): TaskCategory[] {
    const categoriesJson = localStorage.getItem(this.CATEGORIES_KEY);
    if (!categoriesJson) {
      this.saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    
    return JSON.parse(categoriesJson) as TaskCategory[];
  }
  
  static saveCategories(categories: TaskCategory[]): void {
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
  }
  
  static addCategory(name: string, color: string): TaskCategory {
    const categories = this.getCategories();
    
    const newCategory: TaskCategory = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      color
    };
    
    this.saveCategories([...categories, newCategory]);
    return newCategory;
  }
  
  static deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filteredCategories = categories.filter(c => c.id !== id);
    
    if (filteredCategories.length === categories.length) return false;
    
    this.saveCategories(filteredCategories);
    
    const tasks = this.getTasks();
    const tasksToUpdate = tasks.filter(t => t.category === id);
    
    if (tasksToUpdate.length > 0) {
      const updatedTasks = tasks.map(task => 
        task.category === id 
          ? { ...task, category: 'work', updatedAt: new Date() } 
          : task
      );
      
      this.saveTasks(updatedTasks);
    }
    
    return true;
  }
  
  static getFilteredTasks({
    status,
    priority,
    category,
    search,
    dueDate
  }: {
    status?: Task['status'] | Task['status'][];
    priority?: PriorityLevel | PriorityLevel[];
    category?: string | string[];
    search?: string;
    dueDate?: Date | { from?: Date, to?: Date };
  } = {}): Task[] {
    let tasks = this.getTasks();
    
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      tasks = tasks.filter(task => statusArray.includes(task.status));
    }
    
    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority];
      tasks = tasks.filter(task => priorityArray.includes(task.priority));
    }
    
    if (category) {
      const categoryArray = Array.isArray(category) ? category : [category];
      tasks = tasks.filter(task => categoryArray.includes(task.category));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) || 
        task.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (dueDate) {
      if (dueDate instanceof Date) {
        const dateStart = new Date(dueDate);
        dateStart.setHours(0, 0, 0, 0);
        
        const dateEnd = new Date(dueDate);
        dateEnd.setHours(23, 59, 59, 999);
        
        tasks = tasks.filter(task => 
          task.dueDate && 
          task.dueDate >= dateStart && 
          task.dueDate <= dateEnd
        );
      } else {
        if (dueDate.from) {
          const fromDate = new Date(dueDate.from);
          fromDate.setHours(0, 0, 0, 0);
          tasks = tasks.filter(task => 
            task.dueDate && task.dueDate >= fromDate
          );
        }
        
        if (dueDate.to) {
          const toDate = new Date(dueDate.to);
          toDate.setHours(23, 59, 59, 999);
          tasks = tasks.filter(task => 
            task.dueDate && task.dueDate <= toDate
          );
        }
      }
    }
    
    return tasks;
  }
  
  static addTaskDependency(taskId: string, dependencyId: string): boolean {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return false;
    
    if (this.wouldCreateCircularDependency(tasks, taskId, dependencyId)) {
      return false;
    }
    
    const currentDependencies = tasks[taskIndex].dependencies || [];
    
    if (currentDependencies.includes(dependencyId)) {
      return true; 
    }
    
    const updatedTask: Task = {
      ...tasks[taskIndex],
      dependencies: [...currentDependencies, dependencyId],
      updatedAt: new Date()
    };
    
    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    
    return true;
  }
  
  static removeTaskDependency(taskId: string, dependencyId: string): boolean {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return false;
    
    const currentDependencies = tasks[taskIndex].dependencies || [];
    
    if (!currentDependencies.includes(dependencyId)) {
      return false; 
    }
    
    const updatedTask: Task = {
      ...tasks[taskIndex],
      dependencies: currentDependencies.filter(id => id !== dependencyId),
      updatedAt: new Date()
    };
    
    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    
    return true;
  }
  
  
  private static wouldCreateCircularDependency(tasks: Task[], taskId: string, newDependencyId: string): boolean {
    if (taskId === newDependencyId) return true;
    
    const dependencyTask = tasks.find(t => t.id === newDependencyId);
    if (!dependencyTask || !dependencyTask.dependencies || dependencyTask.dependencies.length === 0) {
      return false; 
    }
    
    const checkCircular = (depId: string, visited: Set<string> = new Set()): boolean => {
      if (depId === taskId) return true; 
      if (visited.has(depId)) return false; 
      
      visited.add(depId);
      
      const depTask = tasks.find(t => t.id === depId);
      if (!depTask || !depTask.dependencies) return false;
      
      return depTask.dependencies.some(id => checkCircular(id, new Set(visited)));
    };
    
    return dependencyTask.dependencies.some(id => checkCircular(id));
  }
 
  static getAllTaskDependencies(taskId: string): string[] {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return [];
    }
    
    const allDependencies = new Set<string>();
    
    const addDependencies = (depIds: string[]) => {
      depIds.forEach(depId => {
        if (!allDependencies.has(depId)) {
          allDependencies.add(depId);
          
          const depTask = tasks.find(t => t.id === depId);
          if (depTask && depTask.dependencies && depTask.dependencies.length > 0) {
            addDependencies(depTask.dependencies);
          }
        }
      });
    };
    
    addDependencies(task.dependencies);
    
    return Array.from(allDependencies);
  }
  

  static getDependentTasks(taskId: string): Task[] {
    const tasks = this.getTasks();
    
    return tasks.filter(task => 
      task.dependencies && task.dependencies.includes(taskId)
    );
  }
  

  static logPomodoro(taskId: string): Task | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return null;
    
    const currentCount = tasks[taskIndex].pomodorosCompleted || 0;
    
    const updatedTask: Task = {
      ...tasks[taskIndex],
      pomodorosCompleted: currentCount + 1,
      updatedAt: new Date()
    };
    
    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    
    return updatedTask;
  }
  
  static getProductivityData() {
    const tasks = this.getTasks();
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    completedTasks.forEach(task => {
      if (task.updatedAt) {
        const dayOfWeek = task.updatedAt.getDay();
        dayOfWeekCounts[dayOfWeek]++;
      }
    });
    
    const hourCounts = Array(24).fill(0);
    completedTasks.forEach(task => {
      if (task.updatedAt) {
        const hour = task.updatedAt.getHours();
        hourCounts[hour]++;
      }
    });
    
    const tasksWithTimeData = completedTasks.filter(
      t => typeof t.estimatedTime === 'number' && typeof t.actualTime === 'number'
    );
    
    const accuracyData = {
      overestimated: 0,
      underestimated: 0,
      accurate: 0
    };
    
    tasksWithTimeData.forEach(task => {
      const estimated = task.estimatedTime as number;
      const actual = task.actualTime as number;
      
      if (estimated > actual) {
        accuracyData.overestimated++;
      } else if (estimated < actual) {
        accuracyData.underestimated++;
      } else {
        accuracyData.accurate++;
      }
    });
    
    return {
      dayOfWeekCounts,
      hourCounts,
      accuracyData,
      totalCompleted: completedTasks.length,
      totalTasks: tasks.length
    };
  }
} 