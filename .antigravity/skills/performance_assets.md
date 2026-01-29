# SKILL: Optimización de Rendimiento y Assets (Lighspeed Load) ⚡
**Objetivo:** Garantizar que la web cargue en menos de 2 segundos en redes móviles 3G/4G y pase los Core Web Vitals de Google.

## ⚖️ REGLAS DE TRANSFORMACIÓN
1. **[FORMAT_EVOLUTION]**: Todo archivo `.png` o `.jpg` (excepto logos con transparencia crítica) debe ser convertido o servido en formato **WebP**. 
2. **[AUTO_RESIZE]**: Queda prohibido usar imágenes de 4000px para contenedores de 400px. El @programador debe implementar imágenes responsivas (`srcset`) o redimensionar los assets al tamaño máximo de visualización.
3. **[LAZY_LOADING]**: Todas las imágenes debajo del "fold" (las que no se ven al abrir la web) deben llevar el atributo `loading="lazy"`.
4. **[COMPRESSION_LIMIT]**: La compresión de imágenes debe ser de un 80% (Quality: 80). Es el punto dulce entre peso pluma y calidad visual profesional.

## 🛡️ ESPECIFICACIONES PARA EL @PROGRAMADOR
- **Iconos**: Usar exclusivamente SVG o la librería `lucide-react` ya instalada para evitar peticiones HTTP innecesarias.