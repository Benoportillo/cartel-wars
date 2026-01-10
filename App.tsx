
import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { UserProfile, Rank, Language, WeaponInstance, GlobalSettings, Transaction, PremiumMission } from './types';
import { INITIAL_USER, WEAPONS } from './constants';
import { translations } from './translations';
import Dashboard from './views/Dashboard';
import Garage from './views/Garage';
import PvP from './views/PvP';
import Syndicate from './views/Syndicate';
import Roulette from './views/Roulette';
import Intro from './views/Intro';
import Auth from './views/Auth';
import Admin from './views/Admin';
import GameGuide from './views/GameGuide';

const LangContext = createContext<{ lang: Language, t: any }>({ lang: 'en', t: translations.en });

export const useTranslation = () => useContext(LangContext);

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('cartel_intro_seen'));
  const [showAuth, setShowAuth] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('cartel_settings');
    return saved ? JSON.parse(saved) : { 
      swapEnabled: true, 
      withdrawalEnabled: true, 
      maintenanceMode: false,
      premiumMissions: [],
      referralCommissionPercent: 10 // Default 10%
    };
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('cartel_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...parsed, 
        lastClaimDate: new Date(parsed.lastClaimDate),
        lastTicketDate: parsed.lastTicketDate ? new Date(parsed.lastTicketDate) : new Date(Date.now() - 86400000),
        language: parsed.language || 'en',
        pvpHistory: parsed.pvpHistory || [],
        cwarsBalance: parsed.cwarsBalance || 0,
        completedMissions: parsed.completedMissions || [],
        basePower: parsed.basePower ?? 0,
        baseStatus: parsed.baseStatus ?? 0,
        hasSeenGuide: parsed.hasSeenGuide ?? true 
      };
    }
    return INITIAL_USER;
  });

  const [globalUsers, setGlobalUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('cartel_global_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('cartel_txs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartel_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cartel_txs', JSON.stringify(transactions));
  }, [transactions]);

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
    const weaponPower = profile.ownedWeapons.reduce((acc, instance) => {
      const baseWeapon = WEAPONS.find(w => w.id === instance.weaponId);
      if (!baseWeapon) return acc;
      const basePowerVal = baseWeapon.firepower * 100;
      const upgradeBonus = (instance.caliberLevel + instance.magazineLevel + instance.accessoryLevel - 3) * 8;
      return acc + basePowerVal + upgradeBonus;
    }, 0);

    const weaponStatus = profile.ownedWeapons.reduce((acc, instance) => {
      const baseWeapon = WEAPONS.find(w => w.id === instance.weaponId);
      if (!baseWeapon) return acc;
      const upgradeBonus = (instance.caliberLevel + instance.magazineLevel + instance.accessoryLevel - 3) * 5;
      return acc + baseWeapon.statusBonus + upgradeBonus;
    }, 0);

    return { weaponPower, weaponStatus };
  };

  const saveUser = useCallback((updatedUser: UserProfile) => {
    const { weaponPower, weaponStatus } = calculateWeaponBonuses(updatedUser);
    
    // Total stats = Base (from battles) + Weapon Bonuses
    const finalPower = (updatedUser.basePower ?? 0) + weaponPower;
    const finalStatus = (updatedUser.baseStatus ?? 0) + weaponStatus;

    let finalRank = updatedUser.rank;
    if (!updatedUser.myGangId && !updatedUser.joinedGangId && !updatedUser.isAdmin) {
      finalRank = Rank.INDEPENDIENTE;
    }

    const finalUser = { 
      ...updatedUser, 
      power: finalPower, 
      status: finalStatus, 
      rank: finalRank 
    };
    
    setUser(finalUser);
    updateGlobalUser(finalUser);
    localStorage.setItem('cartel_user', JSON.stringify(finalUser));
  }, [updateGlobalUser]);

  useEffect(() => {
    if (!user.id) return;
    const today = new Date().toISOString().split('T')[0];
    if (user.lastMissionDate !== today) {
        saveUser({ ...user, lastMissionDate: today, completedMissions: [] });
    }
  }, [user.id, user.lastMissionDate, saveUser]);

  const handleLogout = () => {
    localStorage.removeItem('cartel_user');
    setUser(INITIAL_USER);
    setShowAuth(true);
  };

  const changeLang = (l: Language) => {
    saveUser({ ...user, language: l });
    setLangDropdownOpen(false);
  };

  const t = translations[user.language] || translations.en;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user.id && !showIntro) {
        setShowAuth(true);
    }
  }, [user.id, showIntro]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUser(prev => {
        if (!prev.id) return prev;
        if (!prev.myGangId && !prev.joinedGangId) {
            return { ...prev, unclaimedFarming: 0 };
        }
        if (prev.ownedWeapons.length === 0) return prev;
        const totalRate = prev.ownedWeapons.reduce((acc, instance) => {
          const baseWeapon = WEAPONS.find(w => w.id === instance.weaponId);
          if (!baseWeapon) return acc;
          const levelBonus = (instance.caliberLevel - 1) * 0.005;
          return acc + baseWeapon.protectionRate + levelBonus;
        }, 0);
        const now = new Date();
        const diffMs = now.getTime() - new Date(prev.lastClaimDate).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const effectiveHours = Math.min(diffHours, 24);
        const newFarming = totalRate * effectiveHours;
        return { ...prev, unclaimedFarming: Number(newFarming.toFixed(6)) };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleIntroComplete = (lang: Language) => {
    localStorage.setItem('cartel_intro_seen', 'true');
    saveUser({ ...user, language: lang });
    setShowIntro(false);
    setShowAuth(true);
  };

  const handleAuthComplete = (profile: Partial<UserProfile>) => {
    const fullProfile = { ...user, ...profile };
    if (fullProfile.hasSeenGuide === undefined) {
      fullProfile.hasSeenGuide = false;
    }
    saveUser(fullProfile as UserProfile);
    setShowAuth(false);
  };

  const handleGuideFinish = () => {
    saveUser({ ...user, hasSeenGuide: true });
  };

  const flags: Record<Language, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    ru: '🇷🇺',
    ar: '🇦🇪'
  };

  if (showIntro) return <Intro onEnter={handleIntroComplete} />;
  if (showAuth) return <Auth lang={user.language} globalUsers={globalUsers} onComplete={handleAuthComplete} />;
  
  if (user.id && user.hasSeenGuide === false) {
    return (
      <LangContext.Provider value={{ lang: user.language, t }}>
        <GameGuide onFinish={handleGuideFinish} />
      </LangContext.Provider>
    );
  }

  if (user.isBanned) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-red-600 font-marker text-5xl mb-6">BANISHED</h1>
            <p className="text-zinc-500 font-black uppercase tracking-widest">{t.bannedMessage}</p>
            <div className="mt-8 p-4 border border-red-900 bg-red-900/10 rounded-xl">
                <p className="text-xs text-red-500">Cartel ID: #{user.id}</p>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('cartel_user'); window.location.reload(); }}
              className="mt-10 text-[10px] text-zinc-600 hover:text-white uppercase font-black tracking-widest transition-colors"
            >
              Cerrar Expediente
            </button>
        </div>
    );
  }

  return (
    <LangContext.Provider value={{ lang: user.language, t }}>
      <HashRouter>
        <div className={`min-h-screen pb-24 bg-[#0a0a0a] text-gray-200 animate-in fade-in duration-1000 ${user.language === 'ar' ? 'font-sans' : ''}`} dir={user.language === 'ar' ? 'rtl' : 'ltr'}>
          <header className="sticky top-0 z-[100] cartel-gradient border-b border-red-900/50 px-4 py-2 flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img 
                src="https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png" 
                alt="Cartel Wars Logo" 
                className="h-12 w-auto drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              />
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 p-1.5 pr-3 rounded-full hover:bg-zinc-800 transition-all active:scale-95"
                >
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-sm shadow-inner overflow-hidden">
                    {flags[user.language]}
                  </div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{user.language}</span>
                  <span className={`text-[8px] text-zinc-600 transition-transform duration-300 ${langDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {langDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-32 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {(['en', 'es', 'ru', 'ar'] as Language[]).map(l => (
                      <button
                        key={l}
                        onClick={() => changeLang(l)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors ${user.language === l ? 'bg-zinc-900/50 text-red-500' : 'text-zinc-400'}`}
                      >
                        <span className="text-base">{flags[l]}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{l}</span>
                        {user.language === l && <div className="ml-auto w-1 h-1 bg-red-600 rounded-full shadow-[0_0_5px_red]"></div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                  <span className="text-yellow-500 font-bold text-sm">{user.balance.toFixed(2)}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">TON</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                  <span className="text-red-500 font-bold text-sm">{user.cwarsBalance.toFixed(0)}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">CWARS</span>
                  </div>
              </div>
              <div className="w-px h-8 bg-zinc-800"></div>
              
              <button 
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center bg-black/40 border border-red-600/30 rounded-full text-red-500 hover:bg-red-600 hover:text-white hover:scale-110 active:scale-90 transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] group"
                title={t.logout}
              >
                <span className="text-xl filter drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">☠️</span>
              </button>
            </div>
          </header>

          <main className="p-4 max-w-lg mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={user} setUser={saveUser} settings={settings} onLogout={handleLogout} />} />
              <Route path="/garage" element={<Garage user={user} setUser={saveUser} />} />
              <Route path="/pvp" element={<PvP user={user} setUser={saveUser} globalUsers={globalUsers} settings={settings} setSettings={setSettings} />} />
              <Route path="/syndicate" element={<Syndicate user={user} setUser={saveUser} />} />
              <Route path="/roulette" element={<Roulette user={user} setUser={saveUser} />} />
              <Route path="/admin" element={<Admin user={user} users={globalUsers} setUsers={setGlobalUsers} transactions={transactions} setTransactions={setTransactions} settings={settings} setSettings={setSettings} />} />
            </Routes>
          </main>

          <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-red-900/30 flex justify-around items-center py-2 z-50 h-16" dir="ltr">
            <NavItem to="/" icon="🏚️" label={t.dashboard} />
            <NavItem to="/garage" icon="⚔️" label={t.garage} />
            <NavItem to="/pvp" icon="💀" label={t.pvp} />
            <NavItem to="/roulette" icon="🎰" label={t.roulette} />
            <NavItem to="/syndicate" icon="🤝" label={t.syndicate} />
            {user.isAdmin && <NavItem to="/admin" icon="🛠️" label="Admin" />}
          </nav>
        </div>
      </HashRouter>
    </LangContext.Provider>
  );
};

const NavItem: React.FC<{ to: string, icon: string, label: string }> = ({ to, icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex flex-col items-center justify-center w-full py-1 transition-all ${isActive ? 'text-red-500 scale-105' : 'text-gray-500 grayscale opacity-70'}`
    }
  >
    <span className="text-xl mb-0.5">{icon}</span>
    <span className="text-[9px] font-bold uppercase tracking-tight text-center truncate w-full px-1">{label}</span>
  </NavLink>
);

export default App;
