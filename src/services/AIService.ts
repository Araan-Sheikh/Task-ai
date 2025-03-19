import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Task, PriorityLevel, RecurringPattern } from '../models/Task';
import { createGeminiModel } from '../utils/createGeminiModel';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

console.log("API Key check:", API_KEY ? `Key found (${API_KEY.length} chars)` : 'No API key found');

if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY' || API_KEY.length < 10) {
  console.error("ERROR: Invalid or missing Gemini API key. Please check your .env file");
}

let model: GenerativeModel | null = null;
let activeModelName: string = "";

(async function initializeModel() {
  if (!API_KEY || API_KEY.length < 10) return;
  
  try {
    const result = await createGeminiModel(API_KEY);
    model = result.model;
    activeModelName = result.modelName;
    console.log(`Successfully initialized Gemini model: ${activeModelName}`);
  } catch (error) {
    console.error("Failed to initialize Gemini model:", error);
  }
})();

export class AIService {

  private static async ensureModelInitialized(): Promise<GenerativeModel> {
    if (model) return model;
    
    if (!API_KEY || API_KEY.length < 10) {
      throw new Error("Invalid API key configuration. Please check your environment variables.");
    }
    
    try {
      const result = await createGeminiModel(API_KEY);
      model = result.model;
      activeModelName = result.modelName;
      console.log(`Successfully initialized Gemini model: ${activeModelName}`);
      return model;
    } catch (error) {
      console.error("Failed to initialize Gemini model:", error);
      throw new Error("Could not initialize AI model. Please check console for details.");
    }
  }
  

  static async analyzeTask(taskDescription: string, taskTitle: string): Promise<Task['aiSuggestions']> {
    try {
      console.log("Starting task analysis for:", taskTitle);

      const aiModel = await this.ensureModelInitialized();

      const prompt = `Analyze this task and provide suggestions for priority level, category, and time estimation:
      
      Task Title: ${taskTitle}
      Task Description: ${taskDescription}
      
      Format your response as a JSON object with these fields:
      - priority (must be one of: low, medium, high, urgent)
      - category (suggest an appropriate task category)
      - estimatedTime (estimated time to complete in minutes, as a number)
      - reasoning (brief explanation for your suggestions)
      
      Only return the JSON object, no other text.`;
      
      console.log("Sending prompt to Gemini API...");
      
      try {
        const result = await aiModel.generateContent(prompt);
        console.log("Received raw response from Gemini API");
        
        const response = await result.response;
        const textResponse = response.text();
        
        console.log("Response text length:", textResponse.length);
        
        let jsonString = textResponse;
        
        if (textResponse.includes('```')) {
          const codeBlockMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1].trim();
            console.log("Extracted JSON from code block");
          }
        } 
        else {
          const jsonStartIndex = textResponse.indexOf('{');
          const jsonEndIndex = textResponse.lastIndexOf('}') + 1;
          
          if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            jsonString = textResponse.substring(jsonStartIndex, jsonEndIndex);
            console.log("Extracted JSON from response text");
          }
        }
        
        console.log("Attempting to parse:", jsonString);
        
        const suggestions = JSON.parse(jsonString);
        console.log("Successfully parsed suggestions:", suggestions);
        
        return {
          priority: suggestions.priority as PriorityLevel,
          category: suggestions.category,
          estimatedTime: suggestions.estimatedTime,
        };
      } catch (apiError) {
        console.error("API or parsing error:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error analyzing task with AI:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      return {};
    }
  }
  

  static async suggestSubtasks(taskDescription: string): Promise<string[]> {
    try {
      const aiModel = await this.ensureModelInitialized();

      const prompt = `Based on this task description, suggest up to 5 logical subtasks that would help complete this task efficiently:
      
      Task Description: ${taskDescription}
      
      Format your response as a JSON array of strings with each subtask. Only return the JSON array, no other text.`;
      
      try {
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        let jsonString = textResponse;
        if (textResponse.includes('```')) {
          const codeBlockMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1].trim();
          }
        } else {
          const jsonStartIndex = textResponse.indexOf('[');
          const jsonEndIndex = textResponse.lastIndexOf(']') + 1;
          
          if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            jsonString = textResponse.substring(jsonStartIndex, jsonEndIndex);
          }
        }
        
        return JSON.parse(jsonString);
      } catch (apiError) {
        console.error("API or parsing error when suggesting subtasks:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error suggesting subtasks with AI:', error);
      return [];
    }
  }
  

  static async getProductivityInsights(completedTasks: Task[]): Promise<string> {
    try {
      const aiModel = await this.ensureModelInitialized();
      
      if (!completedTasks || completedTasks.length === 0) {
        return "No completed tasks found in the selected time range. Please select a different date range or mark some tasks as completed.";
      }

      const tasksData = completedTasks.map(task => ({
        title: task.title || 'Untitled',
        priority: task.priority || 'medium',
        category: task.category || 'uncategorized',
        estimatedTime: typeof task.estimatedTime === 'number' ? task.estimatedTime : null,
        actualTime: typeof task.actualTime === 'number' ? task.actualTime : null,
        completedDate: task.updatedAt ? task.updatedAt.toISOString() : new Date().toISOString(),
      }));
      
      const prompt = `Analyze these completed tasks and provide productivity insights:
      
      Tasks: ${JSON.stringify(tasksData)}
      
      Provide insights on:
      1. Time estimation accuracy (comparing estimated vs actual times)
      2. Productivity patterns (times of day, days of week, etc.)
      3. Suggestions for improving productivity
      
      If there is not enough data for any section, please indicate this politely.
      Format your response as a string with paragraphs separated by newlines, with clear section headers.`;
      
      try {
        console.log("Generating productivity insights for", completedTasks.length, "tasks");
        const result = await aiModel.generateContent(prompt);
        console.log("Received response from AI model");
        const response = await result.response;
        const insightsText = response.text();
        
        if (!insightsText || insightsText.length < 10) {
          return "The AI model couldn't generate meaningful insights based on your tasks. This might be due to insufficient data or an issue with the AI service. Please try again with more completed tasks.";
        }
        
        return insightsText;
      } catch (apiError) {
        console.error("API error when getting productivity insights:", apiError);
        
        return "Unable to generate productivity insights at this time. The AI service might be temporarily unavailable. Please try again later.";
      }
    } catch (error) {
      console.error('Error getting productivity insights with AI:', error);
      return 'Unable to generate productivity insights at this time. Please try again later.';
    }
  }
  

  static async suggestOptimalSchedule(tasks: Task[]): Promise<any> {
    try {
      const aiModel = await this.ensureModelInitialized();

      // Get local time zone information
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentLocalTime = new Date().toISOString();

      const tasksData = tasks.map(task => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        dueDate: task.dueDate?.toISOString() || null,
        status: task.status,
      }));
      
      const prompt = `Given these tasks, suggest an optimal schedule for completing them:
      
      Tasks: ${JSON.stringify(tasksData)}
      
      Current User Time Zone: ${userTimeZone}
      Current User Local Time: ${currentLocalTime}
      
      Consider:
      - Priority levels
      - Due dates (accounting for user's time zone)
      - Estimated time to complete
      - Current status
      - Working hours (8 AM to 6 PM in user's local time zone)
      
      Format your response as a JSON object with these fields:
      - recommendedSequence (array of task IDs in the suggested order)
      - dailyPlan (object with dates as keys in user's local timezone and arrays of task IDs as values)
      - reasoning (brief explanation for your suggestions)
      
      Important: All dates in the response should be formatted in the user's local time zone.
      
      Only return the JSON object, no other text.`;
      
      try {
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        let jsonString = textResponse;
        if (textResponse.includes('```')) {
          const codeBlockMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1].trim();
          }
        } else {
          const jsonStartIndex = textResponse.indexOf('{');
          const jsonEndIndex = textResponse.lastIndexOf('}') + 1;
          
          if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            jsonString = textResponse.substring(jsonStartIndex, jsonEndIndex);
          }
        }
        
        // Parse the response
        const schedule = JSON.parse(jsonString);
        
        // Normalize dates in the daily plan to ensure they match local time format
        if (schedule.dailyPlan) {
          const normalizedPlan: Record<string, string[]> = {};
          
          Object.keys(schedule.dailyPlan).forEach(dateStr => {
            try {
              // Convert any date format to local time representation
              const date = new Date(dateStr);
              // Use a consistent local date format as key
              const localDateKey = date.toLocaleDateString();
              normalizedPlan[localDateKey] = schedule.dailyPlan[dateStr];
            } catch (e) {
              // If there's an error parsing the date, keep the original format
              normalizedPlan[dateStr] = schedule.dailyPlan[dateStr];
            }
          });
          
          // Replace with normalized plan
          schedule.dailyPlan = normalizedPlan;
        }
        
        return schedule;
      } catch (apiError) {
        console.error("API or parsing error when suggesting schedule:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error suggesting optimal schedule with AI:', error);
      return null;
    }
  }
  

  static async suggestRecurringPattern(taskHistory: Task[]): Promise<RecurringPattern | null> {
    try {
      const aiModel = await this.ensureModelInitialized();
      
      // Get local time zone information
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // If not enough task history, return null
      if (taskHistory.length < 3) {
        return null;
      }
      
      const tasksData = taskHistory.map(task => ({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate?.toISOString() || null,
        createdAt: task.createdAt.toISOString(),
        category: task.category
      }));
      
      const prompt = `Analyze these similar tasks and suggest a recurring pattern if one exists:
      
      Tasks: ${JSON.stringify(tasksData)}
      User Time Zone: ${userTimeZone}
      
      If you detect a pattern in these tasks (like weekly team meetings, monthly reports, etc.), suggest a recurring schedule.
      
      Format your response as a JSON object with these fields:
      - frequency (must be one of: daily, weekly, monthly, yearly)
      - interval (number representing every X days/weeks/months/years)
      - daysOfWeek (array of numbers 0-6 for Sunday-Saturday, only for weekly recurrence)
      - dayOfMonth (number 1-31, only for monthly recurrence)
      - monthOfYear (number 1-12, only for yearly recurrence)
      - confidence (number 0-100 indicating how confident you are in this pattern)
      - reasoning (brief explanation for your suggestion)
      
      Only return the JSON object, no other text. If no clear pattern exists, return a null value.`;
      
      try {
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        let jsonString = textResponse;
        if (textResponse.includes('```')) {
          const codeBlockMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1].trim();
          }
        } else {
          const jsonStartIndex = textResponse.indexOf('{');
          const jsonEndIndex = textResponse.lastIndexOf('}') + 1;
          
          if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            jsonString = textResponse.substring(jsonStartIndex, jsonEndIndex);
          }
        }
        
        const pattern = JSON.parse(jsonString);
        
        // If confidence is below threshold or AI returned null, return null
        if (!pattern || pattern.confidence < 60) {
          return null;
        }
        
        return {
          frequency: pattern.frequency,
          interval: pattern.interval,
          daysOfWeek: pattern.daysOfWeek,
          dayOfMonth: pattern.dayOfMonth,
          monthOfYear: pattern.monthOfYear
        };
      } catch (apiError) {
        console.error("API or parsing error when suggesting recurring pattern:", apiError);
        return null;
      }
    } catch (error) {
      console.error('Error suggesting recurring pattern with AI:', error);
      return null;
    }
  }
  
  static async recommendRelatedTasks(task: Task, existingTasks: Task[]): Promise<Partial<Task>[]> {
    try {
      const aiModel = await this.ensureModelInitialized();
      
      const taskData = {
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority
      };
      
      const existingTasksData = existingTasks.slice(0, 10).map(t => ({
        title: t.title,
        category: t.category
      }));
      
      const prompt = `Based on this task and the user's existing tasks, recommend 1-3 additional tasks that might be helpful:
      
      Current Task: ${JSON.stringify(taskData)}
      
      User's Existing Tasks: ${JSON.stringify(existingTasksData)}
      
      Recommend related tasks that would complement the current task or help achieve the user's goals.
      
      Format your response as a JSON array of objects, each with these fields:
      - title (string, descriptive task title)
      - description (string, brief task description)
      - priority (string, one of: low, medium, high)
      - category (string, use categories from existing tasks when appropriate)
      - estimatedTime (number, estimated minutes to complete)
      - reason (string explaining why this task is recommended)
      
      Only return the JSON array, no other text.`;
      
      try {
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        let jsonString = textResponse;
        if (textResponse.includes('```')) {
          const codeBlockMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1].trim();
          }
        } else {
          const jsonStartIndex = textResponse.indexOf('[');
          const jsonEndIndex = textResponse.lastIndexOf(']') + 1;
          
          if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            jsonString = textResponse.substring(jsonStartIndex, jsonEndIndex);
          }
        }
        
        const recommendations = JSON.parse(jsonString);
        
        // Map recommendations to partial Task objects
        return recommendations.map((rec: any) => ({
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          category: rec.category,
          estimatedTime: rec.estimatedTime,
          aiGenerated: true,
          aiSuggestions: {
            reason: rec.reason
          }
        }));
      } catch (apiError) {
        console.error("API or parsing error when recommending related tasks:", apiError);
        return [];
      }
    } catch (error) {
      console.error('Error recommending related tasks with AI:', error);
      return [];
    }
  }
  
  static async generateDailySummary(tasks: Task[]): Promise<string> {
    try {
      const aiModel = await this.ensureModelInitialized();
      
      const today = new Date();
      const todayStr = today.toLocaleDateString();
      
      // Filter tasks relevant to today (due today, completed today, or in progress)
      const relevantTasks = tasks.filter(task => {
        const isCompleted = task.status === 'completed';
        const completedToday = isCompleted && 
          task.updatedAt && 
          task.updatedAt.toLocaleDateString() === todayStr;
          
        const dueToday = task.dueDate && 
          task.dueDate.toLocaleDateString() === todayStr;
          
        return completedToday || dueToday || task.status === 'in-progress';
      });
      
      if (relevantTasks.length === 0) {
        return "No tasks to summarize for today. Add some tasks to get a daily summary.";
      }
      
      const tasksData = relevantTasks.map(task => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() || null,
        completedAt: task.status === 'completed' ? task.updatedAt?.toISOString() : null,
        category: task.category,
        estimatedTime: task.estimatedTime,
        actualTime: task.actualTime
      }));
      
      const prompt = `Generate a daily summary based on these tasks:
      
      Today's Date: ${todayStr}
      Tasks: ${JSON.stringify(tasksData)}
      
      Create a concise but motivational daily summary that includes:
      1. Accomplishments (completed tasks)
      2. Current focus (in-progress tasks)
      3. Important deadlines for today
      4. Efficiency insights (if time tracking data is available)
      5. A brief motivational message
      
      Format your response in plain text with paragraph breaks where appropriate. Keep it concise and actionable.`;
      
      try {
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (apiError) {
        console.error("API error when generating daily summary:", apiError);
        return "Unable to generate summary at this time. Please try again later.";
      }
    } catch (error) {
      console.error('Error generating daily summary with AI:', error);
      return "Unable to generate summary at this time. Please try again later.";
    }
  }

  static getActiveModelName(): string {
    return activeModelName;
  }
} 