import { GenerativeModel, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const MODEL_NAMES = [
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-1.0-pro"
];

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];


export const createGeminiModel = async (apiKey: string): Promise<{
  model: GenerativeModel;
  modelName: string;
}> => {
  if (!apiKey || apiKey.length < 10) {
    throw new Error("Invalid API key");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const errors: string[] = [];

  for (const modelName of MODEL_NAMES) {
    try {
      console.log(`Attempting to use model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        safetySettings: SAFETY_SETTINGS,
      });

      const testResult = await model.generateContent("Test");
      await testResult.response;

      console.log(`Successfully connected to model: ${modelName}`);
      return { model, modelName };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to use model '${modelName}': ${errorMessage}`);
      console.warn(`Model ${modelName} failed: ${errorMessage}`);
    }
  }

  const errorMessage = `All Gemini models failed: ${errors.join(" | ")}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
};

export default createGeminiModel; 