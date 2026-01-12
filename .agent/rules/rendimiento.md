---
trigger: always_on
---

## 6. Performance Budget
- **Memory Leaks:** Al crear event listeners (clics, teclado), asegura siempre su limpieza (`removeEventListener`) al desmontar componentes.
- **Renderizado:** Evita re-renders innecesarios. Si modificas el loop del juego, prioriza `requestAnimationFrame` sobre `setInterval`.