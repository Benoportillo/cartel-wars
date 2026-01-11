---
trigger: always_on
---

## 5. Seguridad & Lógica Determinista (E-Sport Ready)
- **Desconfianza del Cliente:** NUNCA valides lógica crítica (daño, victoria, recursos) solo en el frontend. Si escribes una función de acción, sugiere inmediatamente cómo validarla en el backend.
- **Sin Random en Cliente:** Si hay aleatoriedad (ej. cofre sorpresa), debe venir pre-calculada o sembrada (seeded) para evitar manipulación de RNG.