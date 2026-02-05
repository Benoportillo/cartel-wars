"use client";

import React, { useState, useEffect } from 'react';
import { UserProfile, Language, Rank } from '../types';
import { useGame } from '../context/GameContext';

interface Props {
  lang: Language;
  globalUsers: UserProfile[];
  onComplete: (profile: UserProfile) => void;
}

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

const Auth: React.FC<Props> = ({ lang, globalUsers, onComplete }) => {
  const { t } = useGame();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    alias: '',
    email: '',
    password: '',
    referralCode: ''
  });
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refId, setRefId] = useState<string | null>(null);

  // Inicializar Telegram WebApp y Referidos
  // Inicializar Telegram WebApp y Referidos
  useEffect(() => {
    // Función para extraer parámetros de la URL
    const getUrlParam = (name: string) => {
      if (typeof window === 'undefined') return null;
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      return params.get(name) || hashParams.get(name);
    };

    // Función principal de detección
    const detectReferral = () => {
      let ref = '';

      // 1. Intentar desde Telegram WebApp (Prioridad Máxima: Fuente más confiable)
      if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
        ref = window.Telegram.WebApp.initDataUnsafe.start_param;
      }

      // 2. Intentar desde URL Params (Fallback)
      if (!ref) {
        ref = getUrlParam('start') ||
          getUrlParam('startapp') ||
          getUrlParam('tgWebAppStartParam') ||
          '';
      }

      // 3. Intentar desde LocalStorage (Último recurso si ya se había guardado)
      if (!ref) {
        const saved = localStorage.getItem('cartel_pending_ref');
        if (saved && saved !== 'undefined' && saved !== 'null') {
          ref = saved;
        }
      }

      // 4. Limpieza Estricta de Basura
      if (ref === 'undefined' || ref === 'null' || ref === 'NaN') {
        ref = '';
      }

      // 5. Validar y Guardar
      if (ref) {
        console.log("✅ REFERIDO CONFIRMADO EN AUTH:", ref);
        setRefId(ref);
        setFormData(prev => ({ ...prev, referralCode: ref }));
        localStorage.setItem('cartel_pending_ref', ref);
      }
    };

    if (typeof window !== 'undefined') {
      // Inicializar Telegram
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser) {
          setTelegramUser(tgUser);
          handleVerify(tgUser);
        }
      }

      // Ejecutar detección inmediatamente
      detectReferral();

      // Re-intentar detección después de 500ms por si Telegram tarda en inyectar
      setTimeout(detectReferral, 500);
    }
  }, []);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  // Función para verificar si el usuario ya existe (Auto-Login)
  const handleVerify = async (tgUser: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: tgUser.id.toString(), checkOnly: true })
      });

      const data = await res.json();

      if (data.user) {
        // Usuario existe, auto-login. Asegurar que ID esté mapeado.
        const profile = { ...data.user, id: data.user.telegramId || data.user._id };
        onComplete(profile);
      } else {
        // Usuario no existe, pre-llenar formulario
        setFormData(prev => ({
          ...prev,
          alias: tgUser.username || tgUser.first_name || `Sicario_${tgUser.id}`
        }));
      }
    } catch (err) {
      console.error("Auto-login check failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el Login
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Determinar si es Email o ID (Username)
      const isEmail = validateEmail(formData.email);

      // Payload para login
      const payload: any = {
        password: formData.password
      };

      if (isEmail) {
        payload.email = formData.email;
      } else {
        payload.telegramId = formData.email; // Usamos el campo email como ID/Username
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.errLogin || 'Error de autenticación');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const profile = { ...data.user, id: data.user.telegramId || data.user._id };
        onComplete(profile);
      } else {
        // Si devuelve user null pero status ok (caso raro en login normal)
        setError('Usuario no encontrado');
        setIsLoading(false);
      }

    } catch (err) {
      console.error("Login failed", err);
      setError('Error de conexión');
      setIsLoading(false);
    }
  };

  // Función para manejar el Registro
  const handleRegister = async () => {
    if (!validateEmail(formData.email)) {
      setError(t.errEmail);
      return;
    }

    setIsLoading(true);
    try {
      // Usar ID de Telegram si existe, sino uno aleatorio
      const cartelId = telegramUser ? telegramUser.id.toString() : Math.floor(10000 + Math.random() * 90000).toString();

      const payload = {
        telegramId: cartelId,
        email: formData.email,
        password: formData.password,
        name: formData.alias,
        referredBy: formData.referralCode || refId || undefined
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error en el registro');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const profile = { ...data.user, id: data.user.telegramId || data.user._id };
        onComplete(profile);
      }

    } catch (err) {
      console.error("Registration failed", err);
      setError('Error de conexión al registrar');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ADMINISTRATOR MASTER ACCESS CHECK (Legacy backdoor)
    if (isLogin && formData.email === 'carteladminwars' && formData.password === 'admin8672652') {
      setIsLoading(true);
      setTimeout(() => {
        onComplete({
          id: '000-ADMIN',
          email: 'admin@cartelwars.com',
          name: 'ADMINISTRADOR',
          nameChanged: true,
          rank: Rank.JEFE,
          balance: 999.99,
          cwarsBalance: 1000000,
          tonWithdrawn: 0,
          tickets: 100,
          referrals: 0,
          lastRaceDate: null,
          ownedWeapons: [],
          lastTicketDate: new Date(),
          language: lang,
          status: 1000,
          inventory: {},
        } as UserProfile);
        setIsLoading(false);
      }, 1000);
      return;
    }

    if (!formData.email || !formData.password || (!isLogin && !formData.alias)) {
      setError(t.errEmpty);
      return;
    }

    if (formData.password.length < 6) {
      setError(t.errShortPass);
      return;
    }

    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a0000_0%,_#000_70%)] opacity-50"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>

      <div className="relative z-10 w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center">
          <img
            src="https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png"
            alt="Logo"
            className="w-32 mx-auto drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] mb-2"
          />
          <h2 className="font-marker text-2xl text-white tracking-widest uppercase italic">
            {isLogin ? t.authLogin : t.authWelcome}
          </h2>
          <div className="h-[1px] w-16 bg-red-600 mx-auto mt-1"></div>

          {telegramUser && (
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-2 animate-pulse">
              DETECTADO: {telegramUser.first_name} (ID: {telegramUser.id})
            </p>
          )}

          {refId && !isLogin && (
            <p className="text-[8px] text-yellow-600 font-black uppercase tracking-widest mt-2 animate-pulse">INVITADO POR SICARIO #{refId}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 bg-zinc-950/90 p-5 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-md">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.aliasLabel}</label>
              {telegramUser ? (
                <div className="w-full bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl text-zinc-400 text-xs font-mono">
                  IDENTIDAD CONFIRMADA: <span className="text-white font-bold">{formData.alias}</span>
                </div>
              ) : (
                <input
                  type="text"
                  maxLength={15}
                  value={formData.alias}
                  onChange={e => setFormData({ ...formData, alias: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs outline-none focus:border-red-600 transition-all font-bold"
                  placeholder="Escobar_V2"
                />
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">{isLogin ? "Usuario / ID" : t.emailLabel}</label>
            <input
              type="text"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs outline-none focus:border-red-600 transition-all font-bold"
              placeholder={isLogin ? "Usuario / Email" : "agente@cartel.com"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.passLabel}</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs outline-none focus:border-red-600 transition-all font-bold tracking-widest"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 p-2 rounded-lg text-center">
              <p className="text-red-500 text-[9px] font-black uppercase">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-red-700 hover:bg-red-600 text-white rounded-xl font-marker text-lg uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(220,38,38,0.2)] active:scale-95 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (isLogin ? t.btnLogin : t.btnSignup)}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="px-4 py-2 text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-widest transition-colors bg-white/5 rounded-full border border-white/5"
          >
            {isLogin ? t.toggleToSignup : t.toggleToLogin}
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-[7px] text-zinc-800 font-black uppercase tracking-[0.5em] pointer-events-none">
        Property of the Cartel Intelligence Agency
      </div>
    </div>
  );
};

export default Auth;
