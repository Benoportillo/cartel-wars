import type { Metadata } from "next";
import { GameProvider } from "../context/GameContext";
import { TonConnectProvider } from '@/components/TonConnectProvider';
import { SocketProvider } from '../context/SocketContext';
import "./globals.css";

// ...

<body>
    <TonConnectProvider>
        <SocketProvider>
            <GameProvider>
                {children}
            </GameProvider>
        </SocketProvider>
    </TonConnectProvider>
</body>
        </html >
    );
}
