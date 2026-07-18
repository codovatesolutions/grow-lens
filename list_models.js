const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('No GEMINI_API_KEY found');
    return;
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    if (data.models) {
      console.log('Available models:');
      console.log(data.models.map(m => m.name));
    } else {
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('Error listing models:', err);
  }
}

main();
