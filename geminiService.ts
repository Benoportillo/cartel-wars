
import { Language } from "./types";

/**
 * Servicio refactorizado para un entorno Node.js.
 * Ahora realiza peticiones al backend local para mayor seguridad.
 */

// Simple in-memory cache en el cliente para evitar peticiones repetitivas
const flavorCache: Record<string, { text: string; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

// URL del servidor Node.js (ajustar según entorno)
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

export const getMafiaFlavor = async (type: 'win' | 'lose' | 'claim' | 'intro', lang: Language = 'es', context: string = '') => {
  const cacheKey = `${type}-${lang}-${context.slice(0, 50)}`;
  
  // Retornar desde cache si es válido
  if (flavorCache[cacheKey] && (Date.now() - flavorCache[cacheKey].timestamp < CACHE_TTL)) {
    return flavorCache[cacheKey].text;
  }

  try {
    // En una app Node real, llamaríamos a nuestro propio backend
    // Aquí implementamos un fallback que detecta si el servidor está disponible
    const response = await fetch(`${API_BASE_URL}/api/mafia-flavor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, lang, context }),
    });

    if (!response.ok) throw new Error('Server unreachable');

    const data = await response.json();
    const result = data.text;
    
    // Guardar en cache
    flavorCache[cacheKey] = {
      text: result,
      timestamp: Date.now()
    };

    return result;
  } catch (error) {
    console.warn("Backend Node.js no detectado o error en petición, usando lógica local de respaldo.");
    
    // Fallback manual para asegurar que la app no se rompa si el servidor Node no está corriendo
    const fallbacks: Record<string, Record<string, string>> = {
      win: { es: "Buen trabajo. El barrio sabe quién manda.", en: "Good job. The hood knows who's boss." },
      lose: { es: "Esta vez te pillaron. No vuelvas a fallar.", en: "They caught you this time. Don't fail again." },
      claim: { es: "Dinero limpio, conciencia sucia.", en: "Clean money, dirty conscience." },
      intro: { es: "Bienvenido a la familia.", en: "Welcome to the family." }
    };

    return fallbacks[type]?.[lang] || "...";
  }
};
