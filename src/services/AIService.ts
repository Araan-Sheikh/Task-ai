import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Task, PriorityLevel } from '../models/Task';
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
      
      Consider:
      - Priority levels
      - Due dates
      - Estimated time to complete
      - Current status
      
      Format your response as a JSON object with these fields:
      - recommendedSequence (array of task IDs in the suggested order)
      - dailyPlan (object with dates as keys and arrays of task IDs as values)
      - reasoning (brief explanation for your suggestions)
      
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
        
        return JSON.parse(jsonString);
      } catch (apiError) {
        console.error("API or parsing error when suggesting schedule:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error suggesting optimal schedule with AI:', error);
      return null;
    }
  }
  

  static getActiveModelName(): string {
    return activeModelName;
  }
} 