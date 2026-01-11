"use client";

import React, { useState, useEffect } from 'react';
import { UserProfile, PremiumMission } from '../types';
import { getMafiaFlavor } from '../geminiService';
import { useGame } from '../context/GameContext';

const PvP: React.FC = () => {
  const { user, setUser, globalUsers, settings, setSettings, t, lang } = useGame();
  const [mode, setMode] = useState<'pvp' | 'ai' | 'premium'>('pvp');
  const [racing, setRacing] = useState(false);
  const [result, setResult] = useState<{ won: boolean, rival: string, flavor: string, powerDiff?: number, reward?: number, respectReward?: number, powerReward?: number } | null>(null);

  const [missionTimers, setMissionTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setMissionTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(id => {
          if (next[id] > 0) {
            next[id]--;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to check if a user is independent
  const isIndie = (u: UserProfile) => !u.myGangId && !u.joinedGangId;
  const getCartelId = (u: UserProfile) => u.myGangId || u.joinedGangId;

  const runPvPMission = async (missionId: string) => {
    if (user.isAdmin || user.completedMissions?.includes(missionId) || racing) return;

    // Filtering Rules:
    // - ADMINS ARE EXCLUDED from being rivals
    // - Cartel users can attack other cartels or independents.
    // - Independent users can attack ANYONE (indies or cartels).
    // - NO ONE can attack users from their own cartel.
    const userCartelId = getCartelId(user);
    const userIsIndie = isIndie(user);

    const rivals = globalUsers.filter(u => {
      if (u.id === user.id || u.isAdmin) return false; // Exclude self and admins
      const targetIsIndie = isIndie(u);
      const targetCartelId = getCartelId(u);

      if (userIsIndie) return true; // Independent can attack any profile
      return targetIsIndie || (targetCartelId !== userCartelId); // Cartel member can attack indies or different cartels
    });

    if (rivals.length === 0) {
      alert(t.noRivalsFound);
      return;
    }

    setRacing(true);
    setResult(null);

    const target = rivals[Math.floor(Math.random() * rivals.length)];
    const targetPower = target.power || 35;
    const targetStatus = target.status || 5;
    const userPower = user.power;
    const userStatus = user.status;

    await new Promise(r => setTimeout(r, 2000));

    const won = userPower >= targetPower;

    // Battle Consequences:
    // Winner: +10% power, +5% respect, +2% of loser's balance.
    // Loser: -30% power, -20 respect, -5% of balance.
    // Burning: The rest is "burned" (lost from the total ecosystem).

    let newBasePower = user.basePower;
    let newBaseStatus = user.baseStatus;
    let newBalance = user.balance;
    let rewardAmount = 0;
    let powerReward = 0;
    let respectReward = 0;

    if (won) {
      rewardAmount = Number((target.balance * 0.02).toFixed(4));
      powerReward = Number((userPower * 0.1).toFixed(2));
      respectReward = Number((userStatus * 0.05).toFixed(0));

      newBasePower += powerReward;
      newBaseStatus += respectReward;
      newBalance += rewardAmount;
    } else {
      rewardAmount = Number((user.balance * 0.05).toFixed(4));
      powerReward = Number((userPower * 0.3).toFixed(2));
      respectReward = 20;

      newBasePower = Math.max(1, newBasePower - powerReward);
      newBaseStatus = Math.max(1, newBaseStatus - respectReward);
      newBalance = Math.max(0, newBalance - rewardAmount);
    }

    const flavorText = await getMafiaFlavor(won ? 'win' : 'lose', lang, `PVP Battle against ${target.name}. Outcome: ${won ? 'Victory' : 'Defeat'}`);

    setUser({
      ...user,
      basePower: Number(newBasePower.toFixed(2)),
      baseStatus: Number(newBaseStatus.toFixed(0)),
      balance: Number(newBalance.toFixed(4)),
      completedMissions: [...(user.completedMissions || []), missionId],
      pvpHistory: [{ won, rival: target.name, powerDiff: userPower - targetPower, timestamp: Date.now() }, ...(user.pvpHistory || [])].slice(0, 5)
    });

    setResult({
      won,
      rival: target.name,
      flavor: flavorText,
      reward: rewardAmount,
      powerReward: powerReward,
      respectReward: respectReward
    });
    setRacing(false);
  };

  const runAIChallenge = async () => {
    if (user.isAdmin) return;
    const cost = 0.02;
    if (user.balance < cost || user.ownedWeapons.length === 0 || racing) return;
    setRacing(true);
    setResult(null);

    await new Promise(r => setTimeout(r, 2500));

    const aiDecision = Math.random();
    const won = aiDecision > 0.45;

    const flavorText = await getMafiaFlavor(won ? 'win' : 'lose', lang, `AI Tactical mission results.`);

    let amount = cost;
    let newBalance = user.balance - cost;

    if (won) {
      const profit = Math.random() * (0.01 - 0.001) + 0.001;
      amount = profit;
      newBalance = user.balance + profit;
    }

    setUser({
      ...user,
      balance: Number(newBalance.toFixed(4)),
      tickets: user.tickets + (Math.random() > 0.9 ? 1 : 0),
    });

    setResult({ won, rival: "Escuadrón SWAT", flavor: flavorText, reward: Number(amount.toFixed(4)) });
    setRacing(false);
  };

  const startPremiumMission = (mission: PremiumMission) => {
    if (mission.completedUserIds.includes(user.id)) return;
    if (mission.completedUserIds.length >= mission.maxUsers) return;

    window.open(mission.link, '_blank');
    setMissionTimers(prev => ({ ...prev, [mission.id]: mission.waitTime }));
  };

  const claimPremiumReward = (mission: PremiumMission) => {
    if (missionTimers[mission.id] > 0) return;

    const updatedMission = {
      ...mission,
      completedUserIds: [...mission.completedUserIds, user.id]
    };

    setSettings({
      ...settings,
      premiumMissions: settings.premiumMissions.map(m => m.id === mission.id ? updatedMission : m)
    });

    setUser({
      ...user,
      balance: user.balance + mission.reward
    });

    alert(`¡Botín reclamado! Has ganado ${mission.reward} TON.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1 overflow-x-auto">
        <ModeBtn active={mode === 'pvp'} onClick={() => setMode('pvp')}>{t.pvpMode}</ModeBtn>
        <ModeBtn active={mode === 'ai'} onClick={() => setMode('ai')}>{t.aiMode}</ModeBtn>
        <ModeBtn active={mode === 'premium'} onClick={() => setMode('premium')}>{t.premiumMode}</ModeBtn>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">PODER DE FUEGO</p>
        <p className="text-4xl font-marker text-white">{user.power.toFixed(2)}</p>
        <p className="text-[9px] text-zinc-600 mt-2 uppercase">{t.higherPowerWins}</p>
      </div>

      {mode === 'pvp' ? (
        <div className="space-y-4">
          <h3 className="font-marker text-xl text-white uppercase tracking-widest text-center">{t.dailyMissions}</h3>

          <div className="grid grid-cols-1 gap-4">
            <MissionCard
              id="attack_rival"
              title={t.attackRivalGang}
              rewardRange="+10% Poder / -30% Riesgo"
              isCompleted={user.completedMissions?.includes('attack_rival') || false}
              onExecute={() => runPvPMission('attack_rival')}
              t={t}
              isAdmin={user.isAdmin}
            />
          </div>
        </div>
      ) : mode === 'ai' ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-4 shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="text-5xl mb-2">☠️</div>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-tight">
            {user.isAdmin ? t.adminOnly : "Misión de Asalto: Ejecutando inteligencia táctica..."}
          </p>
          <button
            onClick={runAIChallenge}
            disabled={user.isAdmin || user.balance < 0.02 || user.ownedWeapons.length === 0 || racing}
            className={`w-full py-4 rounded-lg font-marker text-xl uppercase tracking-widest transition-all ${!user.isAdmin && user.balance >= 0.02 && user.ownedWeapons.length > 0
              ? 'bg-red-600 gold-glow hover:bg-red-500 active:scale-95'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {user.isAdmin ? "MODO ADMIN" : t.searchOpponent + " 🔥"}
          </button>
          {!user.isAdmin && (
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-zinc-600 uppercase">
              <span>COSTO: 0.02 TON</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              <span>GANANCIA: 0.001 - 0.01 TON</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-marker text-xl text-white uppercase tracking-widest text-center">{t.premiumMode}</h3>

          {(!settings.premiumMissions || settings.premiumMissions.length === 0) ? (
            <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl text-center opacity-40">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic">{t.noPremium}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {settings.premiumMissions.map(mission => {
                const isDone = mission.completedUserIds.includes(user.id);
                const isFull = mission.completedUserIds.length >= mission.maxUsers;
                const timer = missionTimers[mission.id];
                const inProgress = timer !== undefined;

                return (
                  <div key={mission.id} className={`bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex items-center gap-5 transition-all ${isDone ? 'opacity-50 grayscale' : 'hover:border-red-600 shadow-xl'}`}>
                    <div className="w-14 h-14 bg-black border border-zinc-800 rounded-xl flex items-center justify-center p-2 shadow-inner overflow-hidden flex-shrink-0">
                      <img src={mission.logo} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-marker text-white text-lg uppercase truncate leading-none mb-1">{mission.title}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-500 font-bold text-xs">{mission.reward} TON</span>
                        <span className="text-[8px] text-zinc-600 font-black uppercase">[{mission.completedUserIds.length}/{mission.maxUsers}] Hitmen</span>
                      </div>

                      {inProgress ? (
                        <div className="space-y-2">
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-red-600 h-full transition-all duration-1000"
                              style={{ width: `${((mission.waitTime - timer) / mission.waitTime) * 100}%` }}
                            ></div>
                          </div>
                          <button
                            onClick={() => timer === 0 && claimPremiumReward(mission)}
                            disabled={timer > 0}
                            className={`w-full py-2 rounded-lg text-[9px] font-black uppercase transition-all ${timer === 0 ? 'bg-green-600 text-white gold-glow' : 'bg-zinc-800 text-zinc-500'}`}
                          >
                            {timer > 0 ? `${t.waitToClaim} (${timer}s)` : t.claimNow}
                          </button>
                        </div>
                      ) : isDone ? (
                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest py-2 border border-zinc-900 rounded-lg bg-zinc-900/20 text-center">
                          {t.alreadyDone} ✓
                        </div>
                      ) : isFull ? (
                        <div className="text-[9px] text-red-900 font-black uppercase tracking-widest py-2 border border-red-900/20 rounded-lg bg-red-900/5 text-center">
                          {t.missionFull} ⛔
                        </div>
                      ) : (
                        <button
                          onClick={() => startPremiumMission(mission)}
                          className="w-full py-2.5 bg-red-700 text-white rounded-lg font-marker text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95"
                        >
                          {t.executeMission}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {racing && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-12 space-y-6">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
          <div className="text-center animate-pulse">
            <h3 className="font-marker text-xl text-white tracking-widest uppercase">{t.aiThinking}</h3>
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-[301] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className={`w-full max-w-sm border-2 p-8 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in duration-300 ${result.won ? 'border-green-600 bg-green-950/20' : 'border-red-600 bg-red-950/20'}`}>
            <h3 className={`text-4xl font-marker ${result.won ? 'text-green-500' : 'text-red-500'}`}>
              {result.won ? t.victory : t.defeat}
            </h3>
            <p className="text-sm text-white italic leading-tight">"{result.flavor}"</p>
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Objetivo:</p>
              <p className="text-white font-marker">{result.rival}</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-marker">
                {result.won ? <span className="text-green-500">+{result.reward?.toFixed(4)} TON</span> : <span className="text-red-500">-{result.reward?.toFixed(4)} TON</span>}
              </div>
              <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <span className={result.won ? 'text-green-500' : 'text-red-500'}>💀 {result.won ? '+' : '-'}{result.powerReward?.toFixed(0)} PODER</span>
                <span className={result.won ? 'text-green-500' : 'text-red-500'}>👑 {result.won ? '+' : '-'}{result.respectReward?.toFixed(0)} RESPETO</span>
              </div>
            </div>
            <button
              onClick={() => setResult(null)}
              className="w-full bg-white text-black py-4 rounded-xl font-marker text-lg uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              {t.backToStreet}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ModeBtn: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`flex-1 py-3 px-2 rounded-lg font-marker text-[10px] md:text-xs transition-all uppercase whitespace-nowrap ${active ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>{children}</button>
);

const MissionCard: React.FC<{ id: string, title: string, rewardRange: string, isCompleted: boolean, onExecute: () => void, t: any, isAdmin?: boolean }> = ({ id, title, rewardRange, isCompleted, onExecute, t, isAdmin }) => (
  <div className={`relative bg-zinc-950 border p-5 rounded-2xl transition-all ${isCompleted || isAdmin ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-red-600 shadow-2xl'}`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className={`text-[10px] font-black uppercase mb-1 ${isCompleted || isAdmin ? 'text-zinc-600' : 'text-red-500'}`}>{t.missionReward}</p>
        <h4 className="font-marker text-lg text-white mb-2 uppercase tracking-tighter">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 font-bold text-xs">{rewardRange}</span>
        </div>
      </div>
      {isCompleted ? (
        <div className="bg-green-900/20 border border-green-900 text-green-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest rotate-12">
          {t.completed}
        </div>
      ) : isAdmin ? (
        <div className="bg-zinc-800 border border-zinc-700 text-zinc-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
          ADMIN
        </div>
      ) : (
        <button
          onClick={onExecute}
          className="bg-red-700 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-marker text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
        >
          {t.executeMission}
        </button>
      )}
    </div>
  </div>
);

export default PvP;
