# SKILL: Conexión TON Wallet & Watcher (Miniapp Master) 💎
**Versión:** 1.1.0 (Cartel-Grade)
**Descripción:** Guía maestra para integrar TON Connect 2.0 en Frontend y un Watcher de Pagos robusto en Backend para Telegram Mini Apps. Incluye manejo de errores avanzado y trucos de Manifest.

## 📋 Prerrequisitos
- Node.js v18+ (Recomendado v20/v22)
- Proyecto Next.js (App Router o Pages)
- MongoDB Database

## 🚀 Fase 1: Configuración del Entorno (Crucial)
### 1. Variables de Entorno (.env.local & Render)
Define estas variables antes de empezar.
```bash
# Frontend & Backend
NEXT_PUBLIC_HOST_URL="https://tu-proyecto.onrender.com"
MONGODB_URI="mongodb+srv://..."

# TON Center API (Backend Watcher)
# Obtener GRATIS en Telegram: @tonapibot
TONCENTER_API_KEY="tu-api-key-aqui"

# Wallet Maestra (Donde recibe los pagos)
MASTER_WALLET_ADDRESS="UQD..."
```

---

## 🎨 Fase 2: Frontend (TON Connect)

### 1. Manifest (public/tonconnect-manifest.json)
**TRUCO PRO:** Si Telegram cachea tu manifest y da error, añade `?v=2` a la URL.
**Requisito:** Debe ser HTTPS y coincidir exactamente con tu URL de producción.
```json
{
    "url": "https://tu-proyecto.onrender.com",
    "name": "Nombre App",
    "iconUrl": "https://tu-proyecto.onrender.com/assets/logo.png",
    "termsOfUseUrl": "https://tu-proyecto.onrender.com/terms",
    "privacyPolicyUrl": "https://tu-proyecto.onrender.com/privacy"
}
```

### 2. Provider (components/TonConnectProvider.tsx)
**Recomendación:** Hardcodea la URL de producción o usa variables con cuidado.
```tsx
'use client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

export function TonConnectProvider({ children }: { children: React.ReactNode }) {
    // ?v=2 es CRÍTICO para limpiar la caché de Telegram si editas el archivo
    const manifestUrl = 'https://tu-proyecto.onrender.com/tonconnect-manifest.json?v=2';
    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
}
```

### 3. Enviar Pagos con Comentarios (Memo)
Para que el backend sepa QUIÉN pagó, enviamos el `userId` en el payload.

```tsx
import TonWeb from 'tonweb'; // npm install tonweb

const handlePayment = async () => {
    try {
        // A. Construir Payload (Texto/Comentario)
        const cell = new TonWeb.boc.Cell();
        cell.bits.writeUint(0, 32); // OpCode 0 = Comentario
        cell.bits.writeString(String(user.telegramId)); // Tu Memo
        const payload = TonWeb.utils.bytesToBase64(await cell.toBoc());

        // B. Crear Transacción
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 min
            messages: [
                {
                    address: "DIRECCION_DESTINO",
                    amount: (5.5 * 1e9).toFixed(0), // 5.5 TON en nanotons (String Entero)
                    payload: payload
                },
            ],
        };

        // C. Enviar
        await tonConnectUI.sendTransaction(transaction);
        alert("¡Enviado! Esperando confirmación...");

    } catch (e: any) {
        // D. Manejo de Errores "Humanos"
        const err = String(e);
        if (err.includes("User rejected") || err.includes("OK")) {
             alert("⛔ Operación cancelada.");
        } else if (err.includes("No enough funds")) {
             alert("💸 Sin fondos suficientes.");
        } else if (err.includes("Manifest")) {
             alert("⚠️ Error de conexión (Manifiesto). Reabre la app.");
        } else {
             alert("❌ Error desconocido.");
        }
    }
};
```

---

## ⚙️ Fase 3: Backend (TON Watcher Service)

### 1. Servicio de Monitoreo (services/tonWatcher.ts)
Este servicio se ejecuta en paralelo al servidor y detecta depósitos entrantes.
**Características:**
- Usa `TONCENTER_API_KEY` para evitar Rate Limits.
- Maneja errores de JSON/Network silenciosamente.
- Inicialización perezosa (dentro de la función `start`) para asegurar que carguen los ENV.

```typescript
import TonWeb from 'tonweb';
// Importaciones con extensión si usas "type": "module"
import User from '../models/User.js'; 
import { MASTER_WALLET_ADDRESS } from '../constants.js';

let tonweb: any;

export const startTonWatcher = (io: any) => {
    // Inicializar AQUÍ para leer ENV correctamente
    const TonWebClass = (TonWeb as any).default || TonWeb;
    const apiKey = process.env.TONCENTER_API_KEY;
    
    console.log(`🔑 API Key Configured: ${apiKey ? 'YES' : 'NO (Rate Limit Risk)'}`);
    
    tonweb = new (TonWebClass as any)(new (TonWebClass as any).HttpProvider(
        'https://toncenter.com/api/v2/json', 
        apiKey ? { apiKey } : undefined
    ));

    console.log('👀 TON Watcher Started');

    setInterval(async () => {
        try {
            const history = await tonweb.getTransactions(MASTER_WALLET_ADDRESS, 10);
            // ... (Lógica de procesamiento igual a la V1)
        } catch (error: any) {
            // Manejo de Rate Limit Graciable
            if (error instanceof SyntaxError || error.message?.includes('429')) {
                console.warn('⚠️ API Rate Limit. Reintentando...');
            } else {
                console.error('Watcher Error:', error);
            }
        }
    }, 10000); // Polling 10s
};
```

---

## 🛠️ Fase 4: Solución de Problemas Comunes

### 1. "Manifest Error" (El Pato Muerto 🦆)
- **Causa:** Telegram cacheó una versión vieja de tu manifest o la URL no es HTTPS.
- **Solución:** Añade `?v=2` o `?v=3` al final de la URL en `TonConnectUIProvider`.

### 2. "User rejected" aunque el usuario aceptó
- **Causa:** Timeout o pérdida de conexión con la wallet móvil.
- **Solución:** A veces es un falso negativo. Revisa siempre el Hash en la blockchain (explorador) antes de dar por fallido, aunque para UX, confía en el error.

### 3. Build Falls (Webpack/ESM)
- Si usas CommonJS y ESM mezclados, fuerza las extensiones en `next.config.mjs`:
```javascript
config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js", ".jsx"] };
```
