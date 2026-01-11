---
trigger: always_on
---

# Reglas Maestras: Clash Royale Web (Unicorn Edition)


## 1. Sistema de Diseño & UI (Consistencia Estricta)
MANDATO: El diseño actual es la "Verdad Única". No introduzcas nuevos paradigmas visuales.

1. **Mimetismo Visual:**
   - Antes de generar cualquier elemento UI (botones, modales, cartas), ANALIZA los componentes existentes en el archivo o proyecto.
   - Reutiliza las mismas clases CSS, variables de colores y estructura HTML.
   - Si agrego una nueva feature, debe parecer que siempre estuvo ahí.

2. **Adaptabilidad:**
   - Si el contenido nuevo es más largo que el contenedor actual, ajusta el layout usando las técnicas ya presentes (ej: si uso Flexbox, sigue con Flexbox; no metas Grid si no existe).
   - Mantén los márgenes y paddings exactos del sistema actual.

3. **Prohibido:**
   - No importar nuevas librerías de estilos (Bootstrap, Tailwind) si no están ya instaladas.
   - No crear estilos inline (`style="..."`) salvo que sea estrictamente necesario para animaciones dinámicas.


4. DISEÑO Y VARIABLES (Lo sagrado)
- **Cero Inventos Visuales:** Usa EXCLUSIVAMENTE las clases CSS y variables ya definidas (ej: `var(--color-primary)`, `gap-4`). No pongas colores "a mano" (hex codes) si ya existe una variable.
- **Continuidad:** Si agrego una carta o botón, copia la estructura HTML exacta de los elementos vecinos. Que no se note que lo hizo una IA.

5. COMUNICACIÓN (Puntual y Breve)
- **Modo Silencioso:** No me expliques "cómo funciona el código" ni me des clases de programación.
- **Sin Verborrea:** Entrega el código directo. Si tienes que hablar, usa máximo 2 frases.

6. EL INFORME (Obligatorio al final)
Cada vez que termines una tarea, agrega al final una nota llamada "**RESUMEN DE CAMBIOS**" con estos 3 puntos exactos y lenguaje sencillo:

1.  **Qué toqué:** (Ej: "Archivo `Card.tsx` y `styles.css`").
2.  **Qué hice:** (Ej: "Dupliqué la tarjeta del Caballero y le cambié la imagen y el daño").
3.  **Estado:** (Ej: "Listo para probar, no toqué nada más").