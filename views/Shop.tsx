'use client';

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SHOP_ITEMS, WEAPONS } from '../constants';
import { Weapon } from '../types';

import { useToast } from '../context/ToastContext';

const Shop: React.FC = () => {
    const { user, setUser } = useGame();
    const { showToast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'WEAPONS' | 'BLACK_MARKET'>('WEAPONS');

    const [items, setItems] = useState<any[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);

    React.useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch('/api/shop/items');
                const data = await res.json();
                if (data.success) {
                    setItems(data.items);
                }
            } catch (e) {
                console.error("Failed to load shop items", e);
            } finally {
                setLoadingItems(false);
            }
        };
        fetchItems();
    }, []);

    const weapons = items.filter(i => i.type === 'WEAPON');

    const blackMarket = items.filter(i => i.type === 'BUFF');

    const handleBuy = async (item: any, type: 'WEAPON' | 'AMMO' | 'ITEM') => {
        if (item.currency === 'TON' && user.balance < item.cost) {
            showToast("Saldo insuficiente en TON.", 'error');
            return;
        }
        if (item.currency === 'CWARS' && user.cwarsBalance < item.cost) {
            showToast("Saldo insuficiente en CWARS.", 'error');
            return;
        }

        // Check if weapon is already owned
        if (type === 'WEAPON' && user.ownedWeapons.some((w: any) => w.weaponId === item.id)) {
            showToast("Ya tienes esta arma.", 'warning');
            return;
        }

        setLoading(item.id);

        try {
            const res = await fetch('/api/shop/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: user.telegramId,
                    itemId: item.id,
                    // Cost, Currency, Type now handled by backend lookup to prevent client tampering
                    // We only send ID (and amount/type if strictly needed but backend should derive)
                })
            });

            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || "Error en la compra.", 'error');
                setLoading(null);
                return;
            }

            const data = await res.json();

            setUser({
                ...user,
                balance: data.newBalance,
                cwarsBalance: data.newCwars,
                ownedWeapons: data.newWeapons || user.ownedWeapons,
                inventory: data.newInventory || user.inventory,
            });

            showToast(`¡Compra exitosa! Has recibido ${item.name}`, 'success');

        } catch (error) {
            console.error("Shop Buy Error:", error);
            showToast("Error de conexión.", 'error');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-marker text-yellow-500 mb-1 drop-shadow-md">MERCADO NEGRO</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest italic">"Plata o Plomo"</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-2 bg-black/40 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm">
                {['WEAPONS', 'BLACK_MARKET'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'bg-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {tab === 'WEAPONS' ? 'Armería' : 'Items'}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loadingItems ? (
                <div className="text-center py-20 text-zinc-500 animate-pulse">Cargando Mercado Negro...</div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {/* WEAPONS TAB */}
                    {activeTab === 'WEAPONS' && weapons.map((weapon) => {
                        const isOwned = user.ownedWeapons.some((w: any) => w.weaponId === weapon.id);
                        const canAfford = user.balance >= weapon.price; // Weapons are in TON usually

                        if (weapon.price === 0) return null; // Skip starter weapon

                        return (
                            <div key={weapon.id} className={`relative bg-zinc-900/80 border ${isOwned ? 'border-green-900/50' : 'border-zinc-800'} p-3 rounded-xl flex flex-col items-center gap-2 shadow-lg overflow-hidden group`}>
                                {isOwned && <div className="absolute top-2 right-2 text-green-500 text-[10px] font-bold border border-green-500 px-1 rounded">OWNED</div>}
                                <div className="w-20 h-20 relative mb-2">
                                    <img src={weapon.image} alt={weapon.name} className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <h3 className="font-marker text-white text-xs uppercase text-center leading-tight">{weapon.name}</h3>
                                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 w-full">
                                    <span title="Poder de Fuego">💀 {(weapon.firepower * 100).toFixed(0)}</span>
                                    {weapon.miningPower > 0 && (
                                        <span title="Producción CWARS" className="text-green-500 font-bold ml-1">
                                            💰 {weapon.miningPower}/h
                                        </span>
                                    )}

                                </div>
                                <p className="text-xs font-bold text-blue-400">{Number.isInteger(weapon.price) ? weapon.price : weapon.price.toFixed(2)} TON</p>
                                <button
                                    onClick={() => handleBuy({ ...weapon, currency: 'TON', cost: weapon.price }, 'WEAPON')}
                                    disabled={!!loading || isOwned || !canAfford}
                                    className={`w-full py-1.5 rounded-lg font-marker text-[10px] uppercase tracking-widest transition-all ${loading === weapon.id ? 'bg-zinc-700' :
                                        isOwned ? 'bg-zinc-800 text-zinc-500 cursor-default' :
                                            canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-zinc-800 text-zinc-600'
                                        }`}
                                >
                                    {isOwned ? 'COMPRADO' : 'COMPRAR'}
                                </button>
                            </div>
                        );
                    })}



                    {/* BLACK MARKET TAB */}
                    {activeTab === 'BLACK_MARKET' && blackMarket.map((item) => {
                        const canAfford = item.currency === 'TON' ? user.balance >= item.price : user.cwarsBalance >= item.price;
                        return (
                            <div key={item.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 shadow-lg">
                                <div className="w-16 h-16">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                </div>
                                <h3 className="font-marker text-white text-xs uppercase text-center">{item.name}</h3>
                                <p className="text-[10px] text-zinc-400 text-center h-8 leading-tight">{item.description}</p>
                                <p className="text-xs font-bold text-yellow-500">{item.price} {item.currency}</p>
                                <button
                                    onClick={() => handleBuy(item, 'ITEM')}
                                    disabled={!!loading || !canAfford}
                                    className={`w-full py-2 rounded-lg font-marker text-xs uppercase tracking-widest transition-all ${canAfford ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-zinc-800 text-zinc-600'
                                        }`}
                                >
                                    COMPRAR
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Shop;
