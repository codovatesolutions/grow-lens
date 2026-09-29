import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Primary & Fallback Models
// Gemini: gemini-2.5-flash is current default, fallback gemini-2.0-flash
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

// Groq models: llama-3.3-70b-versatile, llama-3.1-8b-instant, llama-3.1-70b-versatile
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile'];

// OpenRouter models
const OPENROUTER_MODELS = ['meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1-distill-llama-70b'];

// Timeout helper (default 35s per provider call)
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 35000, providerName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[${providerName}] Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Initialize API Clients
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const groq = GROQ_API_KEY ? new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  timeout: 30000,
}) : null;

const openRouter = OPENROUTER_API_KEY ? new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  timeout: 30000,
}) : null;

export async function llmJson(system: string, userText: string, sessionId: string): Promise<any> {
  let rawResponse = '';
  const errors: string[] = [];

  // 1. Try Gemini
  if (genAI) {
    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[${sessionId}] Attempting Gemini API (${modelName})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: system,
        });

        const callPromise = model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const response = await withTimeout(callPromise, 30000, `Gemini-${modelName}`);
        rawResponse = response.response.text();
        if (rawResponse) break;
      } catch (e: any) {
        const err = `Gemini (${modelName}) error: ${e.message || e}`;
        console.warn(`[${sessionId}] ${err}`);
        errors.push(err);
      }
    }
  }

  // 2. Try Groq (Secondary)
  if (!rawResponse && groq) {
    for (const modelName of GROQ_MODELS) {
      try {
        console.log(`[${sessionId}] Attempting Groq API (${modelName})...`);
        const callPromise = groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userText },
          ],
          response_format: { type: 'json_object' },
        });

        const response = await withTimeout(callPromise, 30000, `Groq-${modelName}`);
        rawResponse = response.choices[0]?.message?.content || '';
        if (rawResponse) break;
      } catch (e: any) {
        const err = `Groq (${modelName}) error: ${e.message || e}`;
        console.warn(`[${sessionId}] ${err}`);
        errors.push(err);
      }
    }
  }

  // 3. Try OpenRouter (Tertiary fallback)
  if (!rawResponse && openRouter) {
    for (const modelName of OPENROUTER_MODELS) {
      try {
        console.log(`[${sessionId}] Attempting OpenRouter API (${modelName})...`);
        const callPromise = openRouter.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userText },
          ],
          response_format: { type: 'json_object' },
        });

        const response = await withTimeout(callPromise, 30000, `OpenRouter-${modelName}`);
        rawResponse = response.choices[0]?.message?.content || '';
        if (rawResponse) break;
      } catch (e: any) {
        const err = `OpenRouter (${modelName}) error: ${e.message || e}`;
        console.warn(`[${sessionId}] ${err}`);
        errors.push(err);
      }
    }
  }

  if (!rawResponse) {
    throw new Error(`All configured LLM providers failed or no API keys were provided. Errors: ${errors.join('; ')}`);
  }

  // Clean raw markdown codeblocks and parse as JSON
  try {
    let cleanText = rawResponse.trim();
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
  let errors: string[] = [];

  // 1. Try Gemini
  if (genAI) {
    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[${sessionId}] Attempting Gemini API (${modelName} Text)...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: system,
        });
        const callPromise = model.generateContent(userText);
        const response = await withTimeout(callPromise, 30000, `Gemini-${modelName}`);
        const text = response.response.text();
        if (text) return text;
      } catch (e: any) {
        errors.push(`Gemini text error: ${e.message || e}`);
      }
    }
  }

  // 2. Try Groq
  if (groq) {
    for (const modelName of GROQ_MODELS) {
      try {
        console.log(`[${sessionId}] Attempting Groq API (${modelName} Text)...`);
        const callPromise = groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userText },
          ],
        });
        const response = await withTimeout(callPromise, 30000, `Groq-${modelName}`);
        const text = response.choices[0]?.message?.content || '';
        if (text) return text;
      } catch (e: any) {
        errors.push(`Groq text error: ${e.message || e}`);
      }
    }
  }

  // 3. Try OpenRouter
  if (openRouter) {
    for (const modelName of OPENROUTER_MODELS) {
      try {
        console.log(`[${sessionId}] Attempting OpenRouter API (${modelName} Text)...`);
        const callPromise = openRouter.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userText },
          ],
        });
        const response = await withTimeout(callPromise, 30000, `OpenRouter-${modelName}`);
        const text = response.choices[0]?.message?.content || '';
        if (text) return text;
      } catch (e: any) {
        errors.push(`OpenRouter text error: ${e.message || e}`);
      }
    }
  }

  throw new Error(`All configured LLM providers failed to generate text response. Errors: ${errors.join('; ')}`);
}

export async function checkLlmHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  providers: {
    gemini: { configured: boolean; healthy: boolean; model?: string; error?: string };
    groq: { configured: boolean; healthy: boolean; model?: string; error?: string };
    openrouter: { configured: boolean; healthy: boolean; model?: string; error?: string };
  };
}> {
  const result: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: {
      gemini: { configured: boolean; healthy: boolean; model?: string; error?: string };
      groq: { configured: boolean; healthy: boolean; model?: string; error?: string };
      openrouter: { configured: boolean; healthy: boolean; model?: string; error?: string };
    };
  } = {
    status: 'unhealthy',
    providers: {
      gemini: { configured: Boolean(genAI), healthy: false },
      groq: { configured: Boolean(groq), healthy: false },
      openrouter: { configured: Boolean(openRouter), healthy: false },
    },
  };

  let healthyCount = 0;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_MODELS[0] });
      const res = await withTimeout(model.generateContent('ping'), 10000, 'Gemini-Health');
      if (res.response.text()) {
        result.providers.gemini = { configured: true, healthy: true, model: GEMINI_MODELS[0] };
        healthyCount++;
      }
    } catch (e: any) {
      result.providers.gemini = { configured: true, healthy: false, error: e.message };
    }
  }

  if (groq) {
    try {
      const res = await withTimeout(
        groq.chat.completions.create({
          model: GROQ_MODELS[0],
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        10000,
        'Groq-Health'
      );
      if (res.choices[0]?.message?.content) {
        result.providers.groq = { configured: true, healthy: true, model: GROQ_MODELS[0] };
        healthyCount++;
      }
    } catch (e: any) {
      result.providers.groq = { configured: true, healthy: false, error: e.message };
    }
  }

  if (openRouter) {
    try {
      const res = await withTimeout(
        openRouter.chat.completions.create({
          model: OPENROUTER_MODELS[0],
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        10000,
        'OpenRouter-Health'
      );
      if (res.choices[0]?.message?.content) {
        result.providers.openrouter = { configured: true, healthy: true, model: OPENROUTER_MODELS[0] };
        healthyCount++;
      }
    } catch (e: any) {
      result.providers.openrouter = { configured: true, healthy: false, error: e.message };
    }
  }

  if (healthyCount > 0) {
    result.status = healthyCount >= 2 ? 'healthy' : 'degraded';
  }

  return result;
}
