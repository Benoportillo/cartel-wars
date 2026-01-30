
import type { Metadata } from "next";
import { GameProvider } from "../context/GameContext";
import { TonConnectProvider } from '@/components/TonConnectProvider';
import { SocketProvider } from '../context/SocketContext';
import "./globals.css";

export const metadata: Metadata = {
    title: "Cartel Wars",
    description: "Plata o Plomo",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <TonConnectProvider>
                    <GameProvider>
                        <SocketProvider>
                            {children}
                        </SocketProvider>
                    </GameProvider>
                </TonConnectProvider>
            </body>
        </html>
    );
}
