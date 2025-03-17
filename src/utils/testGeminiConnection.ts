import { GoogleGenerativeAI } from '@google/generative-ai';
import { createGeminiModel } from './createGeminiModel';


export const testGeminiConnection = async (): Promise<boolean> => {
  console.log("=== TESTING GEMINI API CONNECTION ===");
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  console.log("API Key present:", apiKey ? "YES" : "NO");
  console.log("API Key length:", apiKey?.length || 0);
  
  if (!apiKey || apiKey.length < 10) {
    console.error("Invalid or missing API key");
    return false;
  }
  
  try {
    console.log("Initializing Google Generative AI and testing available models...");
    
    try {
      const { model, modelName } = await createGeminiModel(apiKey);
      
      console.log(`Successfully connected to model: ${modelName}`);
      console.log("Sending test prompt...");
      
      const result = await model.generateContent("Return 'CONNECTION_SUCCESSFUL' if you can read this message");
      const response = await result.response;
      const responseText = response.text();
      
      console.log("Response received:", responseText);
      console.log("Connection test result:", responseText.includes("CONNECTION_SUCCESSFUL") ? "SUCCESS" : "FAILED");
      
      return responseText.includes("CONNECTION_SUCCESSFUL");
    } catch (error) {
      console.error("Error with dynamic model selection:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error testing Gemini API connection:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      
      if (error.message.includes("API key")) {
        console.error("This is an API key issue. Please check that your key is valid and properly configured in the .env file.");
      } else if (error.message.includes("fetch") || error.message.includes("network")) {
        console.error("This appears to be a network connectivity issue. Check your internet connection and any content blockers.");
      } else if (error.message.includes("CORS")) {
        console.error("This is a CORS issue. The API request is being blocked by browser security policies.");
      } else if (error.message.includes("models") && error.message.includes("not found")) {
        console.error("All available model names were tried and none worked. The API may have changed or your key may not have access to these models.");
      }
    }
    return false;
  }
};

if (typeof window !== 'undefined') {
  (window as any).testGeminiConnection = testGeminiConnection;
}

export default testGeminiConnection; 