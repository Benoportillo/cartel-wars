import type { Metadata } from "next";
import { GameProvider } from "../context/GameContext";
import "./globals.css";

export const metadata: Metadata = {
    title: "Cartel Wars: Plata o Plomo",
    description: "Cartel Wars Game",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://telegram.org/js/telegram-web-app.js"></script>
                <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Roboto:wght@300;400;700;900&display=swap" rel="stylesheet" />
            </head>
            <body>
                <GameProvider>
                    {children}
                </GameProvider>
            </body>
        </html>
    );
}
