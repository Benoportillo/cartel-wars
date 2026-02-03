"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, Rank, Language, GlobalSettings, Transaction, WeaponInstance } from '../types';
import { INITIAL_USER, WEAPONS } from '../constants';
import { translations } from '../translations';


interface GameContextType {
    user: UserProfile;
    setUser: (u: UserProfile) => void;
    settings: GlobalSettings;
    setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
    globalUsers: UserProfile[];
    setGlobalUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    lang: Language;
    t: any;
    changeLang: (l: Language) => void;
    logout: () => void;
    showIntro: boolean;
    setShowIntro: (show: boolean) => void;
    showAuth: boolean;
    setShowAuth: (show: boolean) => void;
    handleIntroComplete: (lang: Language) => void;
    handleAuthComplete: (profile: UserProfile) => void;
    handleGuideFinish: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

// Also export useTranslation for compatibility
export const useTranslation = () => {
    const { lang, t } = useGame();
    return { lang, t };
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize state lazily to avoid hydration mismatch, but we are in useEffect for localStorage anyway
    // Actually, for Next.js, we should use useEffect to read localStorage to avoid hydration errors

    const [showIntro, setShowIntro] = useState(false);
    const [showAuth, setShowAuth] = useState(false);

    const [settings, setSettings] = useState<GlobalSettings>({
        swapEnabled: true,
        withdrawalEnabled: true,
        maintenanceMode: false,
        premiumMissions: [],
        referralCommissionPercent: 10
    });

    const [user, setUserState] = useState<UserProfile>(INITIAL_USER);
    const [globalUsers, setGlobalUsers] = useState<UserProfile[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        // ALWAYS SHOW INTRO ON LOAD
        setShowIntro(true);

        const savedSettings = localStorage.getItem('cartel_settings');
        if (savedSettings) setSettings(JSON.parse(savedSettings));

        const savedUser = localStorage.getItem('cartel_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUserState({
                ...parsed,
                ...parsed,
                lastTicketDate: parsed.lastTicketDate ? new Date(parsed.lastTicketDate) : new Date(Date.now() - 86400000),
                language: parsed.language || 'en',
                pvpHistory: parsed.pvpHistory || [],
                cwarsBalance: parsed.cwarsBalance || 0,
                completedMissions: parsed.completedMissions || [],
                basePower: parsed.basePower ?? 0,
                baseStatus: parsed.baseStatus ?? 0,
                hasSeenGuide: parsed.hasSeenGuide ?? true
            });
        }
        // We don't set showAuth here anymore, it will be handled after intro skip/complete

        const savedGlobal = localStorage.getItem('cartel_global_users');
        if (savedGlobal) setGlobalUsers(JSON.parse(savedGlobal));

        const savedTxs = localStorage.getItem('cartel_txs');
        if (savedTxs) setTransactions(JSON.parse(savedTxs));

        setIsLoaded(true);
    }, []);

    // Telegram Auth Check
    useEffect(() => {
        const checkTelegramAuth = async () => {
            if (typeof window === 'undefined') return;

            // CAPTURA DE REFERIDOS GLOBAL (PRIORIDAD ALTA)
            // @ts-ignore
            const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
            if (startParam) {
                console.log("🔥 REFERIDO DETECTADO GLOBALMENTE:", startParam);
                localStorage.setItem('cartel_pending_ref', startParam);
            } else {
                // Intentar leer de URL si no está en initDataUnsafe
                const params = new URLSearchParams(window.location.search);
                const urlRef = params.get('start') || params.get('startapp') || params.get('tgWebAppStartParam');
                if (urlRef) {
                    console.log("🔥 REFERIDO DETECTADO POR URL:", urlRef);
                    localStorage.setItem('cartel_pending_ref', urlRef);
                }
            }

            // @ts-ignore
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

            if (tgUser && tgUser.id) {
                console.log("Checking Telegram User:", tgUser.id);
                try {
                    const res = await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ telegramId: tgUser.id.toString(), checkOnly: true })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.user) {
                            console.log("User found in DB, auto-login:", data.user);
                            setUser(data.user);
                            setShowAuth(false);
                        } else {
                            console.log("User not found in DB (DB Wiped?), forcing logout & clear...");
                            // AUTO-WIPE: User exists in LocalStorage but NOT in DB.
                            // This means DB was wiped. We must clear LocalStorage to allow re-registration.
                            localStorage.removeItem('cartel_user');
                            localStorage.removeItem('cartel_token'); // If used
                            setUserState(INITIAL_USER);
                            setShowAuth(true);
                        }
                    }
                } catch (err) {
                    console.error("Telegram Auth Check Failed:", err);
                }
            }
        };

        checkTelegramAuth();
    }, []);

    // Persist effects
    useEffect(() => {
        if (isLoaded) localStorage.setItem('cartel_settings', JSON.stringify(settings));
    }, [settings, isLoaded]);

    useEffect(() => {
        if (isLoaded) localStorage.setItem('cartel_txs', JSON.stringify(transactions));
    }, [transactions, isLoaded]);

    const updateGlobalUser = useCallback((updatedUser: UserProfile) => {
        setGlobalUsers(prev => {
            const index = prev.findIndex(u => u.id === updatedUser.id);
            const next = [...prev];
            if (index >= 0) next[index] = updatedUser;
            else next.push(updatedUser);
            localStorage.setItem('cartel_global_users', JSON.stringify(next));
            return next;
        });
    }, []);

    const calculateWeaponBonuses = (profile: UserProfile) => {


        const weaponFirepower = profile.ownedWeapons.reduce((acc, instance) => {
            const baseWeapon = WEAPONS.find(w => w.id === instance.weaponId);

            // Prefer Snapshot Data from Instance
            const baseFirepower = instance.firepower !== undefined ? instance.firepower : (baseWeapon?.firepower || 0);

            // Accessories: +10% Base Firepower per level
            const accBonus = (instance.accessoryLevel - 1) * (baseFirepower * 0.10);

            return acc + baseFirepower + accBonus;
        }, 0);

        const weaponStatus = profile.ownedWeapons.reduce((acc, instance) => {
            const baseWeapon = WEAPONS.find(w => w.id === instance.weaponId);

            // Prefer Snapshot Data from Instance
            const baseStatusBonus = instance.statusBonus !== undefined ? instance.statusBonus : (baseWeapon?.statusBonus || 0);

            const upgradeBonus = (instance.caliberLevel + instance.magazineLevel + instance.accessoryLevel - 3) * 5;
            return acc + baseStatusBonus + upgradeBonus;
        }, 0);

        return { weaponStatus, weaponFirepower };
    };

    const setUser = useCallback((updatedUser: UserProfile) => {
        const { weaponStatus, weaponFirepower } = calculateWeaponBonuses(updatedUser);

        // Firepower calculation: Base (0) + Weapons
        const finalFirepower = (updatedUser.basePower ?? 0) + weaponFirepower;
        const finalStatus = (updatedUser.baseStatus ?? 0) + weaponStatus;

        let finalRank = updatedUser.rank;
        if (!updatedUser.myGangId && !updatedUser.joinedGangId && !updatedUser.isAdmin) {
            finalRank = Rank.INDEPENDIENTE;
        }

        const finalUser = {
            ...updatedUser,
            firepower: finalFirepower,
            status: finalStatus,
            rank: finalRank
        };

        setUserState(finalUser);
        updateGlobalUser(finalUser);
        localStorage.setItem('cartel_user', JSON.stringify(finalUser));
    }, [updateGlobalUser]);

    useEffect(() => {
        if (!isLoaded || !user.id) return;
        const today = new Date().toISOString().split('T')[0];
        if (user.lastMissionDate !== today) {
            setUser({ ...user, lastMissionDate: today, completedMissions: [] });
        }
    }, [user.id, user.lastMissionDate, setUser, isLoaded]);

    const logout = () => {
        localStorage.removeItem('cartel_user');
        setUserState(INITIAL_USER);
        setShowAuth(true);
    };

    const changeLang = (l: Language) => {
        setUser({ ...user, language: l });
    };

    const t = translations[user.language] || translations.en;

    // Farming Client Loop REMOVED to prevent clock skew issues.
    // We now rely on the Dashboard's visual counter for immediate feedback
    // and the 10s Auto-Sync for actual state updates.

    // AUTO-SYNC TO SERVER (Persistence) - RE-ENABLED PER USER REQUEST
    useEffect(() => {
        if (!isLoaded || !user.id || !user.telegramId) return;

        const syncInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/game/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegramId: user.telegramId })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.cwarsBalance !== undefined) {
                        // Silent update - maintain local state consistency
                        // We do NOT use setUser here to avoid re-rendering loop issues or aggressive overriding
                        // But since we want to show the balance, we act carefully.
                        // Ideally, we just update the specific fields.
                        // setUserState(prev => ({ ...prev, cwarsBalance: data.cwarsBalance, lastEarningsUpdate: data.lastEarningsUpdate }));

                        // Actually, let's allow it to update full state for consistency
                        setUserState(prev => ({
                            ...prev,
                            cwarsBalance: data.cwarsBalance,
                            lastEarningsUpdate: data.lastEarningsUpdate ? new Date(data.lastEarningsUpdate) : prev.lastEarningsUpdate
                        }));
                    }
                }
            } catch (err) {
                console.error("Auto-Sync Failed:", err);
            }
        }, 10000);

        return () => clearInterval(syncInterval);
    }, [isLoaded, user.id, user.telegramId]);

    const handleIntroComplete = (lang: Language) => {
        localStorage.setItem('cartel_intro_seen', 'true');
        setUser({ ...user, language: lang });
        setShowIntro(false);

        // Check if user is already logged in (has ID)
        if (user.id) {
            // User is registered/logged in, go to dashboard (hide auth)
            setShowAuth(false);
        } else {
            // User not logged in, show auth/registration
            setShowAuth(true);
        }
    };

    const handleAuthComplete = (profile: UserProfile) => {
        setUser(profile);
        setShowAuth(false);
    };

    const handleGuideFinish = () => {
        setUser({ ...user, hasSeenGuide: true });
    };

    if (!isLoaded) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Cartel...</div>;
    }

    return (
        <GameContext.Provider value={{
            user, setUser,
            settings, setSettings,
            globalUsers, setGlobalUsers,
            transactions, setTransactions,
            lang: user.language, t, changeLang,
            logout,
            showIntro, setShowIntro,
            showAuth, setShowAuth,
            handleIntroComplete,
            handleAuthComplete,
            handleGuideFinish
        }}>
            {children}
        </GameContext.Provider>
    );
};
