
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Gemini en el servidor
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.use(cors());
app.use(express.json());

const langNames: Record<string, string> = {
  es: 'Spanish',
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic'
};

/**
 * Endpoint para generar el "flavor text" de la mafia
 * Centraliza la lógica de IA en el servidor para proteger la API Key
 */
app.post('/api/mafia-flavor', async (req, res) => {
  const { type, lang, context } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a ruthless but charismatic Mafia Capo from the game "Cartel Wars: Plata o Plomo". 
      Write a short, punchy, gritty message in ${langNames[lang] || 'English'} for the following event: ${type}. 
      Context: ${context}. 
      Keep it under 120 characters. Use thematic terms relevant to that language and a "gangster" tone.`,
      config: {
        temperature: 0.9,
      }
    });

    const result = response.text || "...";
    res.json({ text: result });
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    res.status(500).json({ error: "Failed to generate mafia flavor", fallback: "..." });
  }
});

// Endpoint de salud del servidor
app.get('/health', (req, res) => {
  res.json({ status: 'active', system: 'Cartel Wars Node Backend' });
});

app.listen(port, () => {
  console.log(`[SERVER] Cartel Wars Node.js running at http://localhost:${port}`);
});
