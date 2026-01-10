
import { GoogleGenAI } from "@google/genai";
import { Language } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const langNames = {
  es: 'Spanish',
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic'
};

// Simple in-memory cache to prevent redundant calls
const flavorCache: Record<string, { text: string; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a function with exponential backoff retry logic.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429;
    const isServerError = error?.status >= 500;

    if ((isRateLimit || isServerError) && retries > 0) {
      console.warn(`Gemini API Error (${error?.status || '429'}). Retrying in ${delay}ms... (${retries} left)`);
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const getMafiaFlavor = async (type: 'win' | 'lose' | 'claim' | 'intro', lang: Language = 'es', context: string = '') => {
  const cacheKey = `${type}-${lang}-${context.slice(0, 50)}`;
  
  // Return from cache if valid
  if (flavorCache[cacheKey] && (Date.now() - flavorCache[cacheKey].timestamp < CACHE_TTL)) {
    return flavorCache[cacheKey].text;
  }

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a ruthless but charismatic Mafia Capo from the game "Cartel Wars: Plata o Plomo". 
        Write a short, punchy, gritty message in ${langNames[lang]} for the following event: ${type}. 
        Context: ${context}. 
        Keep it under 120 characters. Use thematic terms relevant to that language and a "gangster" tone.`,
        config: {
          temperature: 0.9,
        }
      });
    });

    const result = response.text || "...";
    
    // Save to cache
    flavorCache[cacheKey] = {
      text: result,
      timestamp: Date.now()
    };

    return result;
  } catch (error) {
    console.error("Gemini Fatal Error after retries:", error);
    
    // Provide sensible fallbacks based on type and language
    const fallbacks: Record<string, Record<string, string>> = {
      win: { es: "Buen trabajo. El barrio sabe quién manda.", en: "Good job. The hood knows who's boss." },
      lose: { es: "Esta vez te pillaron. No vuelvas a fallar.", en: "They caught you this time. Don't fail again." },
      claim: { es: "Dinero limpio, conciencia sucia.", en: "Clean money, dirty conscience." },
      intro: { es: "Bienvenido a la familia.", en: "Welcome to the family." }
    };

    return fallbacks[type]?.[lang] || "...";
  }
};
