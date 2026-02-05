# SKILL: Optimización de Rendimiento y Assets (Lighspeed Load) ⚡
**Objetivo:** Garantizar que la web/app cargue en < 2s en redes móviles y mantenga 60 FPS en mini-juegos.

## ⚖️ REGLAS DE TRANSFORMACIÓN
1. **[FORMAT_EVOLUTION]**: Todo archivo `.png` o `.jpg` (excepto logos transparentes) debe ser convertido a **WebP**. Para animaciones ligeras en juegos, priorizar **Lottie** o **SVGs animados**.
2. **[AUTO_RESIZE]**: Prohibido usar imágenes de 4000px para contenedores de 400px. Implementar `srcset` responsivo o redimensionar al tamaño máximo de visualización.
3. **[LAZY_LOADING]**: Todas las imágenes "below the fold" deben llevar `loading="lazy"`. En juegos, pre-cargar solo los assets críticos del nivel actual.
4. **[COMPRESSION_LIMIT]**: Calidad de compresión al 80%. Balance perfecto entre peso y fidelidad visual.

## 🛡️ ESPECIFICACIONES TÉCNICAS
- **Iconos**: Usar exclusivamente SVG o la librería `lucide-react`.
- **[AUDIO_OPTIMIZATION]**: En mini-apps, los sonidos deben ser `.mp3` o `.ogg` (128kbps) y cargarse mediante interacción del usuario para evitar bloqueos del navegador.
- **[MEMORY_PURGE]**: Obligatorio limpiar cachés, detener `requestAnimationFrame` y eliminar listeners al desmontar componentes de juego para evitar fugas de memoria.