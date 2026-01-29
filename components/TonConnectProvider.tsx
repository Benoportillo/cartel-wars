'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

export const TonConnectProvider = ({ children }: { children: ReactNode }) => {
    const manifestUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/tonconnect-manifest.json`
        : 'https://cartel-wars.vercel.app/tonconnect-manifest.json';

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
};
