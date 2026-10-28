/**
 * geminiService.js
 * Handles structured calls to Gemini models using @google/genai with strict 15s timeout
 * and graceful fallback.
 */
import { GoogleGenAI } from '@google/genai';

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export function getGeminiModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Execute a prompt with Gemini with a 15-second timeout.
 * Returns { ok: true, data: string } or { ok: false, error: string }
 */
export async function callGemini(prompt, systemInstruction = '', jsonMode = true) {
  if (!isGeminiConfigured()) {
    return { ok: false, error: 'GEMINI_API_KEY not configured' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const modelName = getGeminiModelName();

    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (jsonMode) {
      config.responseMimeType = 'application/json';
    }

    // 15-second timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 15 seconds')), 15000)
    );

    const apiPromise = ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const text = response.text ? response.text.trim() : '';

    if (!text) {
      return { ok: false, error: 'Empty response returned from Gemini' };
    }

    return { ok: true, data: text };
  } catch (err) {
    return { ok: false, error: err.message || 'Unknown error calling Gemini API' };
  }
}
