# SKILL: Maestro del Responsive Total (Agnostic Device) 📱💻
**Objetivo:** Garantizar que Pacifico Sport sea una experiencia premium y funcional en el 100% de los dispositivos, eliminando desbordamientos y cortes de texto.

## ⚖️ ESTRATEGIA DE ADAPTABILIDAD DINÁMICA

### 1. Tipografía Fluida (Anti-Breaking)
- **[CLAMP_RULE]**: Queda prohibido el uso de `font-size` fijos en títulos. Se debe implementar la función `clamp()` para que el texto se reescale suavemente entre el móvil más pequeño (320px) y el desktop.
    * *Fórmula sugerida:* `font-size: clamp(1.5rem, 8vw, 3.5rem);` para H1 y Hero.
- **[LINE_HEIGHT_ADJUST]**: En pantallas < 480px, el interlineado debe aumentar un 10% para mejorar la legibilidad bajo el sol.

### 2. Navegación e Interfaz (UI)
- **[DYNAMIC_NAVBAR]**: 
    * **< 1024px**: Activar obligatoriamente el Menú Hamburguesa con animación de `framer-motion`.
    * **Safe Areas**: Implementar `padding: env(safe-area-inset-...)` para evitar que el "notch" de los iPhones tape el logo o el menú.
- **[TOUCH_TARGETS]**: Todo elemento clickable (botones, enlaces, redes sociales) debe tener un área mínima de `44px x 44px` para evitar frustración del usuario.

### 3. Layout y Grillas (Auto-Layout)
- **[FLEX_GRID_COMBINATION]**:
    * Las secciones de "Beneficios" y "Futuras Estrellas" deben usar `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));`. Esto permite que las columnas se acomoden solas sin necesidad de mil Media Queries.
- **[NO_HORIZONTAL_SCROLL]**: Queda estrictamente prohibido que cualquier elemento (incluyendo modelos 3D o imágenes con drop-shadow) genere desplazamiento lateral.
- **[CONTAINER_GUTTER]**: Margen de seguridad lateral universal de `1.5rem` (24px) en móviles para que el contenido no "pegue" en los bordes físicos del equipo.

### 4. Gestión de Assets (Imágenes y 3D)
- **[VIEWPORT_HEIGHT_FIX]**: En el Hero, usar `100dvh` (Dynamic Viewport Height) en lugar de `100vh` para evitar que la barra de direcciones de Chrome/Safari móvil tape el botón de "Inscríbete ahora".
- **[ASPECT_RATIO_CONTROL]**: 
    * Desktop: `aspect-ratio: 16 / 9`.
    * Mobile: `aspect-ratio: 9 / 16` o `4 / 5` para fondos de sección, asegurando que el punto de interés de la foto siempre sea visible.