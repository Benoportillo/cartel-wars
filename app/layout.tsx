
import type { Metadata } from "next";
import { Inter, Permanent_Marker } from "next/font/google";
import { GameProvider } from "../context/GameContext";
import { TonConnectProvider } from '@/components/TonConnectProvider';
import { SocketProvider } from '../context/SocketContext';
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
            <body className={`${inter.className} ${marker.variable}`}>
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
