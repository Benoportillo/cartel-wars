import React, { useState, useEffect, useCallback } from 'react';
import { useGame, useTranslation } from '../context/GameContext'; // Adjust path if needed
import { useToast } from '../context/ToastContext'; // Adjust path
import { EMPIRE_CONSTANTS, MISSIONS_POOL, BUILDINGS_DATA, STAFF_CATALOG } from '../constants';

// Icons/Graphics placeholder - In real app use proper icons
const ICONS = {
    ENERGY: '⚡',
    REP: '👑',
    CWARS: '💵',
    POLVO: '❄️',
    Vices: '💃',
    Chems: '⚗️',
    Clock: '⏳'
};

const Empire = () => {
    const { user, refreshUser, t } = useGame();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'MISSIONS' | 'EMPIRE'>('MISSIONS');
    const [empireState, setEmpireState] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({});

    // Staff Market Modal State
    const [showStaffMarket, setShowStaffMarket] = useState<{ type: 'vices' | 'chems', slotIndex: number } | null>(null);

    // Fetch Empire State (Energy, synced balances, etc)
    const syncEmpire = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/game/empire/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.telegramId })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setEmpireState(data);
            if (data.cwars !== user.cwarsBalance) {
                refreshUser();
            }
        } catch (e) {
            console.error('Empire sync error:', e);
        }
    }, [user, refreshUser]);

    useEffect(() => {
        syncEmpire();
        const interval = setInterval(syncEmpire, 60000);
        return () => clearInterval(interval);
    }, [syncEmpire]);

    // --- ACTIONS ---

    const executeMission = async (missionId: string) => {
        if (loading || cooldowns[missionId]) return;
        setLoading(true);
        try {
            const res = await fetch('/api/game/empire/mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.telegramId, missionId })
            });
            const data = await res.json();

            if (data.error) {
                showToast(data.message || 'Mission Failed', 'error');
                return;
            }

            if (data.outcome === 'WIN') {
                showToast(`SUCCESS! +${data.reward.cwars} CWARS, +${data.reward.reputation} REP`, 'success');
            } else {
                showToast(`FAILED: ${data.message}`, 'error');
            }

            setEmpireState((prev: any) => ({ ...prev, ...data.userState }));
            refreshUser();

        } catch (e) {
            console.error(e);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const upgradeBuilding = async (type: 'vices' | 'chems') => {
        if (!confirm('Upgrade Building? Cost will be deducted.')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/game/empire/business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.telegramId,
                    action: 'UPGRADE_BUILDING',
                    targetId: type
                })
            });
            const data = await res.json();
            if (data.error) {
                showToast(data.error, 'error');
            } else {
                showToast(`Upgraded to Level ${data.building.level}!`, 'success');
                syncEmpire();
            }
        } catch (e) {
            showToast('Upgrade failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const hireStaff = async (staffId: string) => {
        if (!showStaffMarket) return;
        setLoading(true);
        try {
            const res = await fetch('/api/game/empire/business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.telegramId,
                    action: 'HIRE_STAFF',
                    targetId: staffId,
                    slotIndex: showStaffMarket.slotIndex
                })
            });
            const data = await res.json();
            if (data.error) {
                showToast(data.error, 'error');
            } else {
                showToast('Staff Hired!', 'success');
                syncEmpire();
                setShowStaffMarket(null);
            }
        } catch (e) {
            showToast('Hiring failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const sellStock = async () => {
        const polvoAmount = empireState?.inventory?.polvo || 0;
        if (polvoAmount <= 0) return;
        const amount = prompt(`Sell how much? (Max: ${polvoAmount})`, polvoAmount.toString());
        if (!amount) return;

        setLoading(true);
        try {
            const res = await fetch('/api/game/empire/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.telegramId,
                    amount: parseInt(amount)
                })
            });
            const data = await res.json();
            if (data.error) {
                showToast(data.error, 'error');
            } else {
                if (data.raid) {
                    showToast(`🚨 RAID! ${data.message}`, 'error');
                } else {
                    showToast(`Sold! +${data.totalEarnings} CWARS`, 'success');
                }
                syncEmpire();
            }
        } catch (e) {
            showToast('Sale failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERERS ---

    const renderHeader = () => {
        if (!empireState) return <div className="animate-pulse h-20 bg-gray-800 rounded mb-4"></div>;

        const energyPercent = (empireState.energy / EMPIRE_CONSTANTS.MAX_ENERGY) * 100;
        const isShocked = empireState.shockUntil && new Date(empireState.shockUntil) > new Date();

        return (
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl mb-6 shadow-lg relative overflow-hidden">
                {isShocked && (
                    <div className="absolute inset-0 bg-red-900/80 z-20 flex items-center justify-center flex-col animate-pulse">
                        <span className="text-4xl">🚑</span>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">IN SHOCK</h2>
                        <p className="text-white/80 text-sm">Paralizado hasta: {new Date(empireState.shockUntil).toLocaleTimeString()}</p>
                    </div>
                )}

                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-xl">{ICONS.REP}</span>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Reputation</p>
                            <p className="text-lg font-bold text-white">{empireState.reputation || 0}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase">Energy</p>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xl text-blue-400">{empireState.energy}</span>
                            <span className="text-gray-600">/ {EMPIRE_CONSTANTS.MAX_ENERGY}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-gray-700">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${empireState.energy < 3 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                        style={{ width: `${energyPercent}%` }}
                    />
                </div>
            </div>
        );
    };

    const renderMissionCard = (mission: any) => {
        const canAfford = user?.cwarsBalance >= mission.costCwars;
        const hasEnergy = empireState?.energy >= mission.costEnergy;
        const disabled = loading || !canAfford || !hasEnergy || (empireState?.shockUntil && new Date(empireState.shockUntil) > new Date());

        let tierColor = 'border-gray-600 bg-gray-800';
        if (mission.tier === 'PRO') tierColor = 'border-blue-900 bg-slate-900';
        if (mission.tier === 'CARTEL') tierColor = 'border-red-900/50 bg-red-950/20';

        return (
            <div key={mission.id} className={`border ${tierColor} p-4 rounded-lg relative hover:scale-[1.02] transition-transform`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg">{mission.title}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded bg-black/50 border border-white/10 ${mission.successRate >= 0.7 ? 'text-green-400' : mission.successRate >= 0.6 ? 'text-yellow-400' : 'text-red-500'
                        }`}>
                        {Math.round(mission.successRate * 100)}% Win
                    </span>
                </div>

                <p className="text-gray-400 text-xs text-sm mb-4 min-h-[40px]">{mission.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-black/30 p-2 rounded">
                        <p className="text-gray-500">COST</p>
                        <p className="text-red-300">-{mission.costEnergy} {ICONS.ENERGY}</p>
                        <p className="text-red-300">-{mission.costCwars} {ICONS.CWARS}</p>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                        <p className="text-gray-500">REWARD</p>
                        <p className="text-green-400">+{mission.rewards.cwars} {ICONS.CWARS}</p>
                        <p className="text-yellow-400">+{mission.rewards.reputation} {ICONS.REP}</p>
                    </div>
                </div>

                <button
                    onClick={() => executeMission(mission.id)}
                    disabled={disabled}
                    className={`w-full py-3 rounded-lg font-bold uppercase tracking-wide text-sm transition-all
                        ${disabled
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg hover:brightness-110 active:scale-95'
                        }`}
                >
                    {loading ? 'Executing...' : 'DEPLOY'}
                </button>
            </div>
        );
    };

    const renderBusiness = (type: 'vices' | 'chems') => {
        const config = BUILDINGS_DATA[type];
        const currentLevel = empireState?.buildings?.[type] || 0;
        const nextLvl = currentLevel < 5 ? config.levels.find((l: any) => l.level === currentLevel + 1) : null;
        const currentConfig = config.levels.find((l: any) => l.level === currentLevel);
        const slotsCount = currentConfig?.slots || 0;

        return (
            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {type === 'vices' ? ICONS.Vices : ICONS.Chems} {config.name}
                        </h3>
                        {currentConfig ? (
                            <p className="text-blue-400 text-sm">{currentConfig.name} (Lvl {currentLevel})</p>
                        ) : (
                            <p className="text-gray-500 text-sm">No Owned</p>
                        )}
                    </div>
                    {nextLvl ? (
                        <button
                            onClick={() => upgradeBuilding(type)}
                            className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-xs font-bold uppercase"
                        >
                            Upgrade ({nextLvl.cost})
                        </button>
                    ) : (
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">MAX</span>
                    )}
                </div>

                <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                        const isUnlocked = i < slotsCount;
                        // Find staff in this slot
                        const staff = empireState?.staff?.find((s: any) => s.buildingId === type && s.slotIndex === i);
                        const isExpired = staff && new Date(staff.expiresAt) < new Date();

                        return (
                            <div
                                key={i}
                                onClick={() => {
                                    if (isUnlocked && (!staff || isExpired)) {
                                        setShowStaffMarket({ type, slotIndex: i });
                                    }
                                }}
                                className={`w-20 h-24 rounded border-2 flex flex-col items-center justify-center shrink-0 relative
                                    ${isUnlocked
                                        ? 'border-gray-500 bg-gray-800 cursor-pointer hover:border-white'
                                        : 'border-gray-800 bg-gray-900 opacity-50'
                                    }`}
                            >
                                {isUnlocked ? (
                                    staff && !isExpired ? (
                                        <>
                                            <span className="text-2xl mb-1">👤</span>
                                            <span className="text-[10px] text-white font-bold w-full text-center truncate px-1">
                                                {staff.staffId.toUpperCase()}
                                            </span>
                                            {/* Timer logic could go here */}
                                            <span className="text-[9px] text-green-400">{ICONS.Clock} Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xl mb-1 text-gray-600">+</span>
                                            <span className="text-[9px] text-gray-500">HIRE</span>
                                        </>
                                    )
                                ) : (
                                    <span className="text-gray-700">🔒</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const renderStaffMarket = () => {
        if (!showStaffMarket) return null;

        const buildingType = showStaffMarket.type === 'vices' ? 'VICE' : 'CHEM';
        const availableStaff = STAFF_CATALOG.filter(s => s.type === buildingType);

        return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl p-6 relative">
                    <button
                        onClick={() => setShowStaffMarket(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                    <h3 className="text-xl font-bold text-white mb-1">Hire Staff</h3>
                    <p className="text-gray-400 text-sm mb-4">Slot {showStaffMarket.slotIndex + 1} • {showStaffMarket.type.toUpperCase()}</p>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {availableStaff.map(staff => (
                            <div key={staff.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-white">{staff.name}</h4>
                                    <p className="text-xs text-gray-400">{staff.description}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-blue-300">
                                            {ICONS.Clock} {staff.durationHours}h
                                        </span>
                                        <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-green-300">
                                            Prod: {staff.productionRate} {staff.type === 'VICE' ? '$/h' : 'g/h'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => hireStaff(staff.id)}
                                    className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                                >
                                    {staff.cost} {ICONS.CWARS}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-24 px-4 pt-4 bg-black text-white">
            {renderHeader()}

            {/* TAB SELECTOR */}
            <div className="flex gap-2 mb-6 bg-gray-900 p-1 rounded-lg border border-gray-800">
                <button
                    onClick={() => setActiveTab('MISSIONS')}
                    className={`flex-1 py-2 text-center text-sm font-bold rounded transition-colors ${activeTab === 'MISSIONS' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    {t.missions ? t.missions.toUpperCase() : 'MISSIONS'}
                </button>
                <button
                    onClick={() => setActiveTab('EMPIRE')}
                    className={`flex-1 py-2 text-center text-sm font-bold rounded transition-colors ${activeTab === 'EMPIRE' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    {t.empire ? t.empire.toUpperCase() : 'EMPIRE'}
                </button>
            </div>

            {activeTab === 'MISSIONS' && (
                <div className="space-y-4">
                    {MISSIONS_POOL.map(m => renderMissionCard(m))}
                </div>
            )}

            {activeTab === 'EMPIRE' && (
                <div>
                    {renderBusiness('vices')}
                    {renderBusiness('chems')}

                    <div className="mt-8 border-t border-gray-800 pt-8">
                        <h3 className="text-center text-gray-400 text-sm uppercase tracking-widest mb-4">{t.stockExchange || 'Stock Exchange'}</h3>

                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl">❄️</div>
                            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Current Market Price</p>
                            <div className="flex justify-center items-end gap-2 mb-4">
                                <span className="text-4xl font-mono text-white font-bold">{empireState?.marketPrice || '...'}</span>
                                <span className="text-sm text-green-500 pb-1 mb-1">CWARS / g</span>
                            </div>

                            <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg mb-4">
                                <span className="text-gray-500 text-xs">YOUR STOCK</span>
                                <span className="text-white font-mono">{empireState?.inventory?.polvo || 0} g</span>
                            </div>

                            <button
                                onClick={sellStock}
                                disabled={!empireState?.inventory?.polvo}
                                className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide
                                    ${!empireState?.inventory?.polvo
                                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95 transition-all'
                                    }`}
                            >
                                Sell Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {renderStaffMarket()}
        </div>
    );
};

export default Empire;
