'use client';

import React, { useState } from 'react';
import { UserProfile, Weapon, Rank, WeaponInstance } from '../types';
import { WEAPONS } from '../constants';
import { useGame, useTranslation } from '../context/GameContext';

const Garage: React.FC = () => {
    const { user, setUser, t } = useGame();
    const [selectedWeaponIdx, setSelectedWeaponIdx] = useState(0);

    const upgradeWeapon = async (type: 'caliber' | 'magazine' | 'accessory') => {
        const weapon = user.ownedWeapons[selectedWeaponIdx];
        if (weapon.weaponId === 'starter') return;

        const level = type === 'caliber' ? weapon.caliberLevel : type === 'magazine' ? weapon.magazineLevel : weapon.accessoryLevel;
        const cost = 0.5 * level;

        if (user.balance < cost || level >= 10) return;

        // Optimistic UI Update (optional, but safer to wait for server here for economy)
        try {
            const res = await fetch('/api/game/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: user.telegramId,
                    weaponIndex: selectedWeaponIdx,
                    upgradeType: type,
                    cost: cost
                })
            });

            const data = await res.json();
            if (data.success) {
                // Update local state with server response to ensure sync
                setUser({
                    ...user,
                    balance: data.newBalance,
                    ownedWeapons: data.ownedWeapons
                });

                // Play success sound or visual feedback here if needed
            } else {
                console.error("Upgrade failed:", data.error);
                // Optionally show error toast
            }
        } catch (e) {
            console.error("Upgrade request failed", e);
        }
    };

    const currentInstance = user.ownedWeapons[selectedWeaponIdx];
    const currentBaseWeapon = currentInstance ? WEAPONS.find(w => w.id === currentInstance.weaponId) : null;

    const displayImage = currentBaseWeapon
        ? (currentBaseWeapon.skinImages && currentBaseWeapon.skinImages[currentInstance.skin]) || currentBaseWeapon.image
        : '';

    const isStarter = currentInstance?.weaponId === 'starter';

    // Stats calculation
    const totalUpgrades = currentInstance ? (currentInstance.caliberLevel + currentInstance.magazineLevel + currentInstance.accessoryLevel - 3) : 0;
    const totalPower = currentBaseWeapon ? (currentBaseWeapon.firepower * 100) + (totalUpgrades * 8) : 0;
    const totalRespect = currentBaseWeapon ? currentBaseWeapon.statusBonus + (totalUpgrades * 5) : 0;

    return (
        <div className="space-y-6 pb-6">
            <h2 className="text-2xl font-marker text-center text-red-600 uppercase tracking-widest drop-shadow-lg">{t.workshop}</h2>

            {currentInstance && currentBaseWeapon && (
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

                        <div className="w-full flex justify-between items-center mb-6 px-2">
                            <button
                                disabled={selectedWeaponIdx === 0}
                                onClick={() => setSelectedWeaponIdx(s => s - 1)}
                                className="p-4 bg-zinc-800/50 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-5 transition-all text-2xl shadow-lg"
                            >◀</button>
                            <div className="text-center">
                                <h3 className="font-marker text-2xl text-white tracking-widest uppercase">{currentBaseWeapon.name}</h3>
                                <div className="flex justify-center gap-4 mt-1">
                                    <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">💀 {totalPower.toFixed(2)} {t.power}</span>
                                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">👑 {totalRespect.toFixed(0)} {t.status}</span>
                                </div>
                            </div>
                            <button
                                disabled={selectedWeaponIdx === user.ownedWeapons.length - 1}
                                onClick={() => setSelectedWeaponIdx(s => s + 1)}
                                className="p-4 bg-zinc-800/50 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-5 transition-all text-2xl shadow-lg"
                            >▶</button>
                        </div>

                        <div className="relative w-full h-80 mb-10 bg-black/40 rounded-[3rem] p-10 border border-zinc-800/50 flex items-center justify-center group shadow-inner">
                            <img src={displayImage} className="max-w-full max-h-full object-contain filter drop-shadow-[0_20px_40px_rgba(220,38,38,0.4)] group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none">
                                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500">Weapon Spec #{currentInstance.weaponId.toUpperCase()}</p>
                            </div>
                        </div>

                        {!isStarter ? (
                            <div className="grid grid-cols-1 w-full gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <UpgradeRow label={t.engine} level={currentInstance.caliberLevel} cost={0.5 * currentInstance.caliberLevel} onUpgrade={() => upgradeWeapon('caliber')} balance={user.balance} />
                                        <p className="text-[9px] text-zinc-500 text-right mt-1 italic pr-2">Aumenta Producción (+10% CWARS/Hr)</p>
                                    </div>
                                    <div>
                                        <UpgradeRow label={t.tires} level={currentInstance.magazineLevel} cost={0.5 * currentInstance.magazineLevel} onUpgrade={() => upgradeWeapon('magazine')} balance={user.balance} />
                                        <p className="text-[9px] text-zinc-500 text-right mt-1 italic pr-2">Aumenta Ataques Diarios (+1)</p>
                                    </div>
                                    <div>
                                        <UpgradeRow label={t.startup} level={currentInstance.accessoryLevel} cost={0.5 * currentInstance.accessoryLevel} onUpgrade={() => upgradeWeapon('accessory')} balance={user.balance} />
                                        <p className="text-[9px] text-zinc-500 text-right mt-1 italic pr-2">Aumenta Daño Crítico (+10%)</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full p-8 bg-black/40 border border-zinc-800 rounded-3xl text-center">
                                <p className="text-zinc-500 font-marker text-lg uppercase tracking-widest">{t.meleeNotice}</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-2">{t.noTacticalUpgrades}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {user.ownedWeapons.length === 0 && (
                <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-3xl opacity-50 border-dashed">
                    <p className="font-marker text-2xl uppercase tracking-widest text-zinc-600">{t.arsenalEmpty}</p>
                </div>
            )}
        </div>
    );
};

const UpgradeRow: React.FC<{ label: string, level: number, cost: number, onUpgrade: () => void, balance: number }> = ({ label, level, cost, onUpgrade, balance }) => (
    <div className="flex items-center justify-between bg-black/60 p-5 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all hover:bg-zinc-950/80">
        <div className="flex flex-col flex-1">
            <div className="flex justify-between mb-2">
                <span className="text-[11px] text-zinc-400 font-black uppercase tracking-[0.2em]">{label}</span>
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">NIVEL {level} / 10</span>
            </div>
            <div className="flex gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-700 ${i < level ? 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]' : 'bg-zinc-900'}`}></div>
                ))}
            </div>
        </div>
        <button
            onClick={onUpgrade}
            disabled={balance < cost || level >= 10}
            className={`ml-6 px-6 py-3 rounded-xl font-marker text-xs uppercase tracking-widest transition-all min-w-[100px] shadow-lg ${balance >= cost && level < 10 ? 'bg-red-700 text-white hover:bg-red-600 active:scale-95 gold-glow' : 'bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed'
                }`}
        >
            {level >= 10 ? 'MÁX' : `${cost.toFixed(2)}`}
        </button>
    </div>
);

export default Garage;
