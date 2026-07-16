import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Initialize Clients
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const groq = GROQ_API_KEY ? new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
}) : null;

const openRouter = OPENROUTER_API_KEY ? new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

export async function llmJson(system: string, userText: string, sessionId: string): Promise<any> {
  let rawResponse = '';
  const errors: string[] = [];

  // 1. Try Gemini (Primary for website scanning / heavy reasoning)
  if (genAI) {
    try {
      console.log(`[${sessionId}] Attempting Gemini API (JSON)...`);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: system,
      });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      rawResponse = response.response.text();
    } catch (e: any) {
      const err = `Gemini error: ${e.message || e}`;
      console.warn(`[${sessionId}] ${err}`);
      errors.push(err);
    }
  }

  // 2. Try Groq (Secondary)
  if (!rawResponse && groq) {
    try {
      console.log(`[${sessionId}] Attempting Groq API (fallback JSON)...`);
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
        response_format: { type: 'json_object' },
      });

      rawResponse = response.choices[0].message.content || '';
    } catch (e: any) {
      const err = `Groq error: ${e.message || e}`;
      console.warn(`[${sessionId}] ${err}`);
      errors.push(err);
    }
  }

  // 3. Try OpenRouter (Tertiary fallback)
  if (!rawResponse && openRouter) {
    try {
      console.log(`[${sessionId}] Attempting OpenRouter API (fallback JSON)...`);
      const response = await openRouter.chat.completions.create({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
        response_format: { type: 'json_object' },
      });

      rawResponse = response.choices[0].message.content || '';
    } catch (e: any) {
      const err = `OpenRouter error: ${e.message || e}`;
      console.warn(`[${sessionId}] ${err}`);
      errors.push(err);
    }
  }

  if (!rawResponse) {
    throw new Error(`All configured LLM providers failed or no API keys were provided. Errors: ${errors.join('; ')}`);
  }

  // Clean raw markdown blocks and parse as JSON
  try {
    let cleanText = rawResponse.trim();
    // Remove markdown code block wrappers
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '');
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object wrapper {...} found in response.');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err: any) {
    console.error(`[${sessionId}] JSON parsing failed for response: ${rawResponse.substring(0, 500)}`);
    throw new Error(`LLM completed but output could not be parsed as JSON: ${err.message}`);
  }
}

export async function llmText(system: string, userText: string, sessionId: string): Promise<string> {
  // 1. Try Gemini
  if (genAI) {
    try {
      console.log(`[${sessionId}] Attempting Gemini API (Text)...`);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: system,
      });
      const response = await model.generateContent(userText);
      return response.response.text();
    } catch (e: any) {
      console.warn(`[${sessionId}] Gemini text error: ${e.message || e}`);
    }
  }

  // 2. Try Groq
  if (groq) {
    try {
      console.log(`[${sessionId}] Attempting Groq API (fallback Text)...`);
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-specdec',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
      });
      return response.choices[0].message.content || '';
    } catch (e: any) {
      console.warn(`[${sessionId}] Groq text error: ${e.message || e}`);
    }
  }

  // 3. Try OpenRouter
  if (openRouter) {
    try {
      console.log(`[${sessionId}] Attempting OpenRouter API (fallback Text)...`);
      const response = await openRouter.chat.completions.create({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
      });
      return response.choices[0].message.content || '';
    } catch (e: any) {
      console.warn(`[${sessionId}] OpenRouter text error: ${e.message || e}`);
    }
  }

  throw new Error('All configured LLM providers failed to generate text response.');
}
