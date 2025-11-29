/**
 * Google Gemini 2.0 Flash Experimental Client Configuration
 * 
 * This module provides a configured Gemini client for AI operations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization to ensure dotenv.config() is called first
let genAI = null;
let model = null;

function getModel() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY is not set in environment variables');
      throw new Error('API key not configured');
    }
    console.log(`🔑 API Key loaded: ${apiKey.substring(0, 15)}... (length: ${apiKey.length})`);
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }
  return model;
}

/**
 * Call Gemini AI with a prompt
 * @param {string} prompt - The input prompt
 * @param {Object} options - Optional configuration
 * @param {number} options.maxTokens - Maximum output tokens (default: 2000)
 * @param {number} options.temperature - Temperature for randomness (default: 0.7)
 * @param {number} options.topP - Top-p sampling (default: 0.9)
 * @returns {Promise<string>} The generated text response
 */
export async function callGemini(prompt, options = {}) {
  try {
    console.log('🤖 Calling Gemini 2.0 Flash...');
    
    const {
      maxTokens = 2000,
      temperature = 0.7,
      topP = 0.9
    } = options;

    const geminiModel = getModel();
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        topP,
      },
    });

    const response = result.response;
    const text = response.text();
    
    console.log('✅ Gemini 2.0 Flash responded');
    return text.trim();
  } catch (error) {
    console.error('❌ Gemini AI Error:', error.message);
    throw new Error('AI service temporarily unavailable. Please try again in a moment.');
  }
}

/**
 * Simple example function to test Gemini
 * @returns {Promise<string>} A greeting from Gemini
 */
export async function testGemini() {
  const prompt = 'Say "Hello! I am Gemini 2.0 Flash and I am ready to help." in a friendly way.';
  return await callGemini(prompt);
}

/**
 * Check if Gemini API key is configured
 * @returns {boolean} True if API key is configured
 */
export function isConfigured() {
  return !!process.env.GEMINI_API_KEY && 
         process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
}

export { getModel };

