# SKILL: Consistencia Visual 🎨
- **Colores**: Extraer variables CSS (`--primary`, `--secondary`, `--accent`) directamente del logo de Pacifico Sport.
- **Inmutabilidad**: Aplicar `[ASSET_IMMUTABILITY]`. El botón de "Contacto" y el de "WhatsApp" deben ser idénticos en toda la landing page.
- **Responsive**: Mobile: 375px | Tablet: 768px | Desktop: 1024px.
- **[HAPTIC_FEEDBACK]**: Todo botón importante debe tener un estado `:active` visual claro (escala 0.95) y, si es posible, activar la vibración del móvil (`navigator.vibrate`) en mini-juegos.
- **[GLASS_SKELETONS]**: Mientras cargan datos reales, usar "Skeleton Screens" con el estilo de la marca en lugar de un spinner genérico.
- **[THEME_VARIABLES]**: Definir `--border-radius` global para que si el Arquitecto decide cambiar la redondez, toda la app cambie al unísono.