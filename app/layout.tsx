
import type { Metadata } from "next";
import { Inter, Permanent_Marker } from "next/font/google";
import { GameProvider } from "../context/GameContext";
import { TonConnectProvider } from '@/components/TonConnectProvider';
import { SocketProvider } from '../context/SocketContext';
import { ToastProvider } from '../context/ToastContext';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-marker" });

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
            <head>
                <script src="https://telegram.org/js/telegram-web-app.js" async />
            </head>
            <body className={`${inter.className} ${marker.variable}`}>
                <TonConnectProvider>
                    <GameProvider>
                        <SocketProvider>
                            <ToastProvider>
                                {children}
                            </ToastProvider>
                        </SocketProvider>
                    </GameProvider>
                </TonConnectProvider>
            </body>
        </html>
    );
}
