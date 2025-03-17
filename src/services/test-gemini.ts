import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'YOUR_API_KEY';

console.log(`Using API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`);

async function testGeminiAPI() {
  try {
    console.log('Initializing Gemini API...');
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    console.log('Getting model...');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    console.log('Sending test prompt...');
    const prompt = 'Write a short hello world message in JSON format';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Response received:');
    console.log(text);
    
    console.log('Test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}

testGeminiAPI().then(success => {
  console.log(`Test ${success ? 'PASSED' : 'FAILED'}`);
});

export { testGeminiAPI }; 