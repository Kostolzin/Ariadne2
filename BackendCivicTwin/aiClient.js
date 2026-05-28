// aiClient.js
// Handles communication with Gemini only.

import { GoogleGenAI } from "@google/genai";

export function createAIClient(apiKey) {
  return new GoogleGenAI({
    apiKey: apiKey,
  });
}