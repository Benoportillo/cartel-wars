# SKILL: Conexión TON Wallet & Watcher (Miniapp Master) 💎
**Versión:** 1.0.0 (Unicorn Stable)
**Descripción:** Guía maestra para integrar TON Connect 2.0 en Frontend y un Watcher de Pagos robusto en Backend para Telegram Mini Apps.

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

### 2. Configuración de TypeScript (Backend/ESM)
Para evitar errores de "Import", configura `tsconfig.server.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": ".",
    "noEmit": false
  },
  "include": ["server.ts", "services/**/*", "models/**/*", "constants.ts"]
}
```

---

## 🎨 Fase 2: Frontend (TON Connect)

### 1. Manifest (public/tonconnect-manifest.json)
**Requisito:** Debe ser HTTPS y coincidir exactamente con tu URL de producción.
```json
{
    "url": "https://tu-proyecto.onrender.com",
    "name": "Nombre App",
    "iconUrl": "https://url-a-tu-logo.png",
    "termsOfUseUrl": "https://tu-proyecto.onrender.com/terms",
    "privacyPolicyUrl": "https://tu-proyecto.onrender.com/privacy"
}
```

### 2. Provider (components/TonConnectProvider.tsx)
```tsx
'use client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

export function TonConnectProvider({ children }: { children: React.ReactNode }) {
    const manifestUrl = 'https://tu-proyecto.onrender.com/tonconnect-manifest.json';
    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
}
```

### 3. Botón de Conexión
```tsx
import { TonConnectButton } from '@tonconnect/ui-react';
// ...
<TonConnectButton />
```

---

## ⚙️ Fase 3: Backend (TON Watcher Service)

### 1. Servicio de Monitoreo (services/tonWatcher.ts)
Este servicio se ejecuta en paralelo al servidor y detecta depósitos entrantes.
**Características:**
- Usa `TONCENTER_API_KEY` para evitar Rate Limits.
- Maneja errores de JSON/Network silenciosamente.
- Detecta depósitos por `Check Only` o `Memo`.

```typescript
import TonWeb from 'tonweb';
// Importa tus modelos y constantes (recuerda la extensión .js si usas ESM)
import User from '../models/User.js';
import { MASTER_WALLET_ADDRESS } from '../constants.js';

const TonWebClass = (TonWeb as any).default || TonWeb;
const apiKey = process.env.TONCENTER_API_KEY;

// Inicialización Robusta
const tonweb = new (TonWebClass as any)(new (TonWebClass as any).HttpProvider(
    'https://toncenter.com/api/v2/json', 
    apiKey ? { apiKey } : undefined
));

const processedTxIds = new Set<string>();

export const startTonWatcher = (io: any) => {
    console.log('👀 TON Watcher Started');

    setInterval(async () => {
        try {
            const history = await tonweb.getTransactions(MASTER_WALLET_ADDRESS, 10);
            
            for (const tx of history) {
                const txHash = tx.transaction_id.hash;
                const inMsg = tx.in_msg;

                // 1. Filtrar transacciones entrantes con valor
                if (!inMsg || inMsg.value <= 0) continue;

                // 2. Verificar duplicados (Memoria y DB)
                // const exists = await Transaction.findOne({ txid: txHash }); ...
                if (processedTxIds.has(txHash)) continue;
                processedTxIds.add(txHash);

                // 3. Procesar Lógica de Negocio (Dar saldo, activar item, etc)
                const amountTon = Number(inMsg.value) / 1e9;
                console.log(`💰 Depósito detectado: ${amountTon} TON`);
                
                // 4. Notificar al Frontend (Socket.io)
                // io.to(...).emit('balance_update', ...);
            }
        } catch (error: any) {
             // Manejo de Errores Silencioso (Anti-Crash)
            if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')) {
                console.warn('⚠️ API Rate Limit. Reintentando...');
            } else {
                console.error('Watcher Error:', error);
            }
        }
    }, 10000); // Polling cada 10s
};
```

### 2. Integración en Servidor (server.ts)
```typescript
import { startTonWatcher } from './services/tonWatcher.js';

// ... Conexión DB ...
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('🍃 MongoDB Conectado');
    startTonWatcher(io); // Iniciar Watcher solo tras conectar DB
});
```

---

## 🛠️ Fase 4: Solución de Problemas Comunes (Troubleshooting)

### 1. "Watcher Error: Unexpected end of JSON input"
- **Causa:** TonCenter está bloqueando tu IP por exceso de peticiones.
- **Solución:** ¡Configura `TONCENTER_API_KEY` en tus variables de entorno!

### 2. "Module not found: Can't resolve './types.js'"
- **Causa:** Next.js (Webpack) se confunde con las extensiones explícitas `.js` que necesita el backend.
- **Solución:** Crea `next.config.mjs`:
```javascript
const nextConfig = {
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};
export default nextConfig;
```

### 3. "Styles not loading / Plain Text"
- **Causa:** Falta `postcss.config.cjs` o dependencias.
- **Solución:**
    1. `npm install -D tailwindcss@3 postcss autoprefixer`
    2. Crear `postcss.config.cjs`:
       ```javascript
       module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
       ```
