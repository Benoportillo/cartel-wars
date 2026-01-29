"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from '../context/GameContext';
import { Language } from '../types';
import Intro from '../views/Intro';
import Auth from '../views/Auth';
import GameGuide from '../views/GameGuide';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        user, t, changeLang, logout,
        showIntro, showAuth,
        handleIntroComplete, handleAuthComplete, handleGuideFinish,
        globalUsers
    } = useGame();

    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const flags: Record<Language, string> = {
        en: '🇺🇸',
        es: '🇪🇸',
        ru: '🇷🇺',
        ar: '🇦🇪'
    };

    if (showIntro) return <Intro onEnter={handleIntroComplete} />;
    if (showAuth) return <Auth lang={user.language} globalUsers={globalUsers} onComplete={handleAuthComplete} />;

    if (user.id && user.hasSeenGuide === false) {
        return <GameGuide onFinish={handleGuideFinish} />;
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
                                        onClick={() => { changeLang(l); setLangDropdownOpen(false); }}
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
                        onClick={logout}
                        className="w-10 h-10 flex items-center justify-center bg-black/40 border border-red-600/30 rounded-full text-red-500 hover:bg-red-600 hover:text-white hover:scale-110 active:scale-90 transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] group"
                        title={t.logout}
                    >
                        <span className="text-xl filter drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">☠️</span>
                    </button>
                </div>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-red-900/30 flex justify-around items-center py-2 z-50 h-16" dir="ltr">
                <NavItem to="/" icon="🏚️" label={t.dashboard} active={pathname === '/'} />
                <NavItem to="/garage" icon="⚔️" label={t.garage} active={pathname === '/garage'} />
                <NavItem to="/pvp" icon="💀" label={t.pvp} active={pathname === '/pvp'} />
                <NavItem to="/roulette" icon="🎰" label={t.roulette} active={pathname === '/roulette'} />
                <NavItem to="/shop" icon="🛒" label="Shop" active={pathname === '/shop'} />
                <NavItem to="/syndicate" icon="🤝" label={t.syndicate} active={pathname === '/syndicate'} />
                {user.isAdmin && <NavItem to="/admin" icon="🛠️" label="Admin" active={pathname === '/admin'} />}
            </nav>
        </div>
    );
};

const NavItem: React.FC<{ to: string, icon: string, label: string, active: boolean }> = ({ to, icon, label, active }) => (
    <Link
        href={to}
        className={`flex flex-col items-center justify-center w-full py-1 transition-all ${active ? 'text-red-500 scale-105' : 'text-gray-500 grayscale opacity-70'}`}
    >
        <span className="text-xl mb-0.5">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-tight text-center truncate w-full px-1">{label}</span>
    </Link>
);

export default MainLayout;
