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
    const [activeTab, setActiveTab] = useState<'WEAPONS' | 'AMMO' | 'BLACK_MARKET'>('WEAPONS');

    const AMMO_PACKS = [
        { id: 'ammo_5', name: 'Pack Ligero (5)', cost: 500, currency: 'CWARS', amount: 5, image: '/assets/items/ammo_light.png' },
        { id: 'ammo_20', name: 'Pack Pesado (20)', cost: 1800, currency: 'CWARS', amount: 20, image: '/assets/items/ammo_heavy.png' },
        { id: 'ammo_50', name: 'Caja Munición (50)', cost: 0.1, currency: 'TON', amount: 50, image: '/assets/items/ammo_crate.png' },
    ];

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
            alert("Ya tienes esta arma.");
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
                    cost: item.cost,
                    currency: item.currency || 'CWARS', // Default to CWARS for weapons if not specified
                    type: type,
                    amount: item.amount // For ammo
                })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Error en la compra.");
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
                ammo: data.newAmmo !== undefined ? data.newAmmo : user.ammo
            });

            alert(`¡Compra exitosa! Has recibido ${item.name}`);

        } catch (error) {
            console.error("Shop Buy Error:", error);
            alert("Error de conexión.");
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
                {['WEAPONS', 'AMMO', 'BLACK_MARKET'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'bg-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {tab === 'WEAPONS' ? 'Armería' : tab === 'AMMO' ? 'Munición' : 'Items'}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 gap-3">
                {/* WEAPONS TAB */}
                {activeTab === 'WEAPONS' && WEAPONS.map((weapon) => {
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
                                <span title="Producción Estimada" className="text-green-500">💰 +{weapon.miningPower}/h</span>
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

                {/* AMMO TAB */}
                {activeTab === 'AMMO' && AMMO_PACKS.map((pack) => {
                    // Quick Override for Pricing based on user feedback
                    // 50 Ammo was 0.1 TON -> Make it 0.5 TON?
                    // 5 Ammo was 500 CWARS -> OK?
                    // 20 Ammo was 1800 CWARS -> OK?
                    const realCost = pack.id === 'ammo_50' ? 0.5 : pack.cost;

                    const canAfford = pack.currency === 'TON' ? user.balance >= realCost : user.cwarsBalance >= realCost;
                    return (
                        <div key={pack.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-3 shadow-lg">
                            <div className="w-20 h-20 text-4xl animate-pulse">
                                <img src={pack.image} alt={pack.name} className="w-full h-full object-contain" />
                            </div>
                            <h3 className="font-marker text-white text-sm uppercase text-center">{pack.name}</h3>
                            <p className="text-xs font-bold text-yellow-500">{Number.isInteger(realCost) ? realCost : realCost.toFixed(2)} {pack.currency}</p>
                            <button
                                onClick={() => handleBuy({ ...pack, cost: realCost }, 'AMMO')}
                                disabled={!!loading || !canAfford}
                                className={`w-full py-2 rounded-lg font-marker text-xs uppercase tracking-widest transition-all ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-600'
                                    }`}
                            >
                                COMPRAR
                            </button>
                        </div>
                    );
                })}

                {/* BLACK MARKET TAB */}
                {activeTab === 'BLACK_MARKET' && SHOP_ITEMS.map((item) => {
                    const canAfford = item.price <= user.cwarsBalance; // Items are usually CWARS? Check constants.
                    // In constants: price is 0.5, 1.2 etc. Wait, constants says price 0.5 but doesn't specify currency explicitly in the object, 
                    // but the previous Shop.tsx had them as CWARS 500. 
                    // Let's assume constants prices are in TON if small, or CWARS if large. 
                    // Actually, looking at constants.tsx: "price: 0.5", "price: 1.2". This looks like TON.
                    // BUT the user wants to burn CWARS. 
                    // Let's override constants for now or interpret them. 
                    // User said: "Shop UI... Implement Buff Purchasing (Consumables)".
                    // In previous Shop.tsx: Oil was 500 CWARS.
                    // Let's stick to CWARS for items to burn them.
                    // I will hardcode CWARS prices for now or map them.

                    const realCost = item.id === 'oil' ? 500 : item.id === 'charm' ? 1000 : 2000;
                    const realCurrency = 'CWARS';
                    const userHasBalance = user.cwarsBalance >= realCost;

                    return (
                        <div key={item.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 shadow-lg">
                            <div className="w-16 h-16">
                                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                            <h3 className="font-marker text-white text-xs uppercase text-center">{item.name}</h3>
                            <p className="text-[10px] text-zinc-400 text-center h-8 leading-tight">{item.description}</p>
                            <p className="text-xs font-bold text-yellow-500">{realCost} {realCurrency}</p>
                            <button
                                onClick={() => handleBuy({ ...item, cost: realCost, currency: realCurrency }, 'ITEM')}
                                disabled={!!loading || !userHasBalance}
                                className={`w-full py-2 rounded-lg font-marker text-xs uppercase tracking-widest transition-all ${userHasBalance ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-zinc-800 text-zinc-600'
                                    }`}
                            >
                                COMPRAR
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Shop;
