'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

export const TonConnectProvider = ({ children }: { children: ReactNode }) => {
    // Hardcoded to ensure production uses the correct URL
    // Cache bust query param added to fix "Manifest Error" in Telegram
    const manifestUrl = 'https://cartel-wars.onrender.com/tonconnect-manifest.json?v=2';

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
};
