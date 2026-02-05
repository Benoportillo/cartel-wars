# SKILL: Maestro del Responsive Total (Agnostic Device) 📱💻

**Objetivo:** Garantizar que cada proyecto sea una experiencia premium y funcional en el 100% de los dispositivos, eliminando desbordamientos y cortes de texto. Especial atención a la jugabilidad y usabilidad en dispositivos móviles.

---

## ⚖️ ESTRATEGIA DE ADAPTABILIDAD DINÁMICA

### 1. Tipografía Fluida (Anti-Breaking)
- **[CLAMP_RULE]**: Queda prohibido el uso de `font-size` fijos en títulos. Se debe implementar la función `clamp()` para que el texto se reescale suavemente entre el móvil más pequeño (320px) y el desktop.
    * *Fórmula sugerida:* `font-size: clamp(1.5rem, 8vw, 3.5rem);` para H1 y Hero.
- **[LINE_HEIGHT_ADJUST]**: En pantallas < 480px, el interlineado debe aumentar un 10% para mejorar la legibilidad bajo el sol o en condiciones de alta movilidad.

### 2. Navegación e Interfaz (UI)
- **[DYNAMIC_NAVBAR]**: 
    * **< 1024px**: Activar obligatoriamente el Menú Hamburguesa con animación de `framer-motion`.
    * **Safe Areas**: Implementar `padding: env(safe-area-inset-...)` para evitar que el "notch" de los iPhones tape el logo o el menú.
- **[TOUCH_TARGETS]**: Todo elemento clickable (botones, enlaces, redes sociales) debe tener un área mínima de `44px x 44px` para evitar frustración del usuario.
- **[INTERACTIVE_HITBOX]**: (Gaming/Apps) [CALL_SKILL: ui_consistency.md] Los botones de control en mini-juegos deben aumentar su área de contacto a `52px x 52px` para evitar toques fantasma.

### 3. Layout y Grillas (Auto-Layout)
- **[FLEX_GRID_COMBINATION]**:
    * Las secciones de "Beneficios", "Futuras Estrellas" o "Grillas de Juego" deben usar `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));`. Esto permite que las columnas se acomoden solas sin necesidad de Media Queries manuales.
- **[NO_HORIZONTAL_SCROLL]**: Queda estrictamente prohibido que cualquier elemento (incluyendo modelos 3D o imágenes con drop-shadow) genere desplazamiento lateral.
- **[CONTAINER_GUTTER]**: Margen de seguridad lateral universal de `1.5rem` (24px) en móviles para que el contenido no "pegue" en los bordes físicos del equipo.

### 4. Gestión de Assets y Pantalla Completa
- **[VIEWPORT_HEIGHT_FIX]**: En el Hero o interfaces de juego, usar `100dvh` (Dynamic Viewport Height) en lugar de `100vh` para evitar que la barra de direcciones de los navegadores móviles tape elementos críticos.
- **[ASPECT_RATIO_CONTROL]**: 
    * Desktop: `aspect-ratio: 16 / 9`.
    * Mobile: `aspect-ratio: 9 / 16` o `4 / 5` para fondos de sección, asegurando que el punto de interés de la foto siempre sea visible.
- **[ORIENTATION_LOCK]**: En mini-apps de juegos que requieran formato horizontal, mostrar un overlay: "Por favor, gira tu dispositivo" mediante media queries `@media (orientation: portrait)`.

---

## 🔌 PROTOCOLO DE INTEGRACIÓN Y CONTROL
- **[SCOPE_LOCK_UI]**: Al ajustar el responsive, el @programador no debe alterar la lógica de negocio ni mover componentes de orden a menos que sea estrictamente necesario para la adaptabilidad.
- **[SYNC_CHECK]**: Antes de dar por terminado un componente, el Arquitecto debe validar que no existan anchos fijos (`width: 500px`) que rompan el flujo.
- **[PERFORMANCE_LINK]**: [CALL_SKILL: performance_assets.md] Si el cambio de resolución requiere cargar una versión de imagen distinta, invocar la skill de optimización.