import React, { useState, useEffect } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useGame } from '../context/GameContext';
import TonWeb from 'tonweb';

interface WalletModalProps {
    onClose: () => void;
}

import { MASTER_WALLET_ADDRESS } from '../constants';

const MASTER_WALLET = MASTER_WALLET_ADDRESS;

const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
    const { user, setUser, t, lang } = useGame();
    const userFriendlyAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [txHash, setTxHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const [gangsterBonus, setGangsterBonus] = useState<number | null>(null);

    // Check Gangster Hour on mount
    useEffect(() => {
        // In a real app, we would fetch this from an API endpoint like /api/finance/status
        // For now, let's simulate checking the time locally based on the logic we implemented in backend
        // Or better, let's make a quick call to check status if we had an endpoint.
        // Since we don't have a dedicated status endpoint, we'll just show a static message or
        // rely on the user trying to deposit.
        // But the user wants to SEE the indicator.
        return;
    }, []);
    const handleWalletPayment = async () => {
        if (!amount || Number(amount) <= 0) {
            setMessage({ text: "Ingresa un monto válido", type: 'error' });
            return;
        }

        // 1. Check Connection
        if (!tonConnectUI.connected) {
            console.log("Wallet not connected. Opening modal...");
            setMessage({ text: "Conecta tu Wallet para continuar...", type: 'success' }); // Yellow/Info ideally, but using existing types
            await tonConnectUI.openModal();
            return;
        }

        try {
            setLoading(true);
            console.log("Starting transaction construction...");
            console.log("User ID for Memo:", user.telegramId);

            // Construct payload with User ID as comment
            // NOTE: Using TonWeb on client requires it to be bundled correctly.
            const cell = new TonWeb.boc.Cell();
            cell.bits.writeUint(0, 32); // 0 = Text Comment op code
            cell.bits.writeString(String(user.telegramId) || 'UNKNOWN'); // User ID
            const payload = TonWeb.utils.bytesToBase64(await cell.toBoc());

            console.log("Payload generated:", payload);

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: MASTER_WALLET,
                        amount: (Number(amount) * 1e9).toFixed(0), // Ensure integer string
                        payload: payload
                    },
                ],
            };

            console.log("Sending Transaction:", transaction);

            await tonConnectUI.sendTransaction(transaction);

            console.log("Transaction successfully sent to wallet for signature.");
            setMessage({ text: "Transacción enviada. Esperando confirmación...", type: 'success' });

            setTimeout(() => {
                onClose();
                alert("Depósito enviado. El sistema te acreditará en cuanto se confirme en la blockchain (aprox 10-30s).");
            }, 5000);

        } catch (e: any) {
            console.error("Payment Failed:", e);
            if (e?.message?.includes("User rejected")) {
                setMessage({ text: "Cancelado por el usuario", type: 'error' });
            } else {
                setMessage({ text: `Error: ${e.message || "Fallo desconocido"}`, type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        if (!txHash) {
            setMessage({ text: "Ingresa el Hash (TXID)", type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/finance/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.telegramId, amount: Number(amount), txHash })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ text: `¡Depósito Exitoso! +${data.bonusApplied > 0 ? ` (Bonus ${data.bonusApplied})` : ''}`, type: 'success' });
                setUser({ ...user, balance: data.newBalance });
                setTimeout(onClose, 2000);
            } else {
                setMessage({ text: data.error || "Error al verificar", type: 'error' });
            }
        } catch (e) {
            setMessage({ text: "Error de conexión", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!amount) {
            setMessage({ text: "Ingresa un monto", type: 'error' });
            return;
        }
        if (!userFriendlyAddress) {
            setMessage({ text: "Conecta tu Wallet primero", type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/finance/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.telegramId, amount: Number(amount), address: userFriendlyAddress })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ text: "Retiro procesado (Simulado)", type: 'success' });
                setUser({ ...user, balance: data.newBalance });
                setTimeout(onClose, 2000);
            } else {
                setMessage({ text: data.error || "Error al retirar", type: 'error' });
            }
        } catch (e) {
            setMessage({ text: "Error de conexión", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>

                <h2 className="text-2xl font-marker text-white text-center mb-6 uppercase tracking-widest">Bóveda del Cartel</h2>

                <div className="flex bg-black p-1 rounded-xl border border-zinc-800 gap-1 mb-6">
                    <button onClick={() => setActiveTab('deposit')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'deposit' ? 'bg-green-900/20 text-green-500 border border-green-900' : 'text-zinc-600'}`}>Depositar</button>
                    <button onClick={() => setActiveTab('withdraw')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'withdraw' ? 'bg-red-900/20 text-red-500 border border-red-900' : 'text-zinc-600'}`}>Retirar</button>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-xl text-center text-xs font-bold uppercase ${message.type === 'error' ? 'bg-red-900/20 text-red-500' : 'bg-green-900/20 text-green-500'}`}>
                        {message.text}
                    </div>
                )}

                {activeTab === 'deposit' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        {gangsterBonus && (
                            <div className="bg-yellow-900/20 border border-yellow-600 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                                <span className="text-2xl">🍸</span>
                                <div>
                                    <p className="text-yellow-500 font-black uppercase text-xs">¡HORA GANGSTER ACTIVA!</p>
                                    <p className="text-[10px] text-yellow-200/70">Bonus de hasta +{(gangsterBonus * 100).toFixed(0)}% en tu depósito.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-green-900/20 p-2 rounded-xl border border-green-800 mb-2 flex items-center justify-center gap-2">
                            <span className="text-lg">🤖</span>
                            <p className="text-[10px] text-green-400 text-center uppercase font-bold">
                                SISTEMA AUTOMÁTICO: Tu ID ({user.telegramId}) se adjuntará solo.
                            </p>
                        </div>

                        <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 text-center">
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2">BÓVEDA PRINCIPAL</p>
                            <p className="text-xs font-mono text-white break-all bg-zinc-900 p-2 rounded border border-zinc-800 select-all">{MASTER_WALLET}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">CANTIDAD A DEPOSITAR (TON)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-green-600 font-mono" placeholder="0.1" />
                        </div>

                        <button
                            onClick={handleWalletPayment}
                            disabled={!amount || Number(amount) <= 0}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-marker text-lg uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95 disabled:opacity-50 mb-2 flex items-center justify-center gap-2"
                        >
                            <span>💎</span> PAGAR CON WALLET
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-zinc-800"></div>
                            <span className="flex-shrink-0 mx-4 text-zinc-600 text-[9px] uppercase font-black">O MANUALMENTE</span>
                            <div className="flex-grow border-t border-zinc-800"></div>
                        </div>

                        <div className="space-y-2 opacity-50 hover:opacity-100 transition-opacity">
                            <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">HASH DE TRANSACCIÓN (TXID)</label>
                            <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-green-600 font-mono text-xs" placeholder="Pegar Hash si pagaste manual..." />
                        </div>

                        <button onClick={handleDeposit} disabled={loading} className="w-full py-3 bg-zinc-800 text-zinc-400 rounded-xl font-marker text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50">
                            {loading ? 'Verificando...' : 'VERIFICAR MANUALMENTE'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                        <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">SALDO DISPONIBLE</p>
                                <p className="text-xl font-bold text-white">{user.balance.toFixed(2)} TON</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">FEE DE RETIRO</p>
                                <p className="text-xl font-bold text-red-500">5%</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">CANTIDAD A RETIRAR</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-red-600 font-mono" placeholder="0.0" />
                        </div>

                        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">RECIBIRÁS EN TU WALLET</p>
                            <p className="text-lg font-mono text-white">
                                {amount ? (Number(amount) * 0.95).toFixed(4) : '0.0000'} TON
                            </p>
                            <p className="text-[9px] text-zinc-600 mt-1 truncate">{userFriendlyAddress || 'Wallet no conectada'}</p>
                        </div>

                        <button onClick={handleWithdraw} disabled={loading || !userFriendlyAddress} className="w-full py-4 bg-red-700 text-white rounded-xl font-marker text-lg uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Procesando...' : 'SOLICITAR RETIRO'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletModal;
