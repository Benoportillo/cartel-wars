
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Weapon, Rank, BattleRecord, GlobalSettings, PremiumMission } from '../types';
import { WEAPONS } from '../constants';
import { getMafiaFlavor } from '../geminiService';
import { useTranslation } from '../App';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  globalUsers: UserProfile[];
  settings: GlobalSettings;
  setSettings: (s: GlobalSettings) => void;
}

const MISSION_TIERS = [
  { users: 500, price: 0.8 },
  { users: 1000, price: 1.5 },
  { users: 2000, price: 2.8 },
  { users: 5000, price: 6.0 },
];

const PvP: React.FC<Props> = ({ user, setUser, globalUsers, settings, setSettings }) => {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'pvp' | 'ai' | 'premium'>('pvp');
  const [premiumView, setPremiumView] = useState<'explore' | 'history'>('explore');
  const [racing, setRacing] = useState(false);
  const [result, setResult] = useState<{ won: boolean, rival: string, flavor: string, powerDiff?: number, reward?: number, respectReward?: number, powerReward?: number } | null>(null);
  
  // Sistema de Toasts para mensajes del Cartel
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const [missionTimers, setMissionTimers] = useState<Record<string, number>>({});
  
  // Estado para misiones que deben desaparecer por completo de la vista del usuario
  const [fullyHiddenMissions, setFullyHiddenMissions] = useState<string[]>([]);

  // Mostrar toast
  const showCartelMessage = (msg: string, type: 'error' | 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Inicializar misiones ya ocultas
  useEffect(() => {
    if (settings.premiumMissions) {
      const alreadyDone = settings.premiumMissions
        .filter(m => m.completedUserIds.includes(user.id))
        .map(m => m.id);
      setFullyHiddenMissions(alreadyDone);
    }
  }, [user.id, settings.premiumMissions]);

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

  const isIndie = (u: UserProfile) => !u.myGangId && !u.joinedGangId;
  const getCartelId = (u: UserProfile) => u.myGangId || u.joinedGangId;

  const runPvPMission = async (missionId: string) => {
    if (user.isAdmin || user.completedMissions?.includes(missionId) || racing) return;
    
    const userCartelId = getCartelId(user);
    const userIsIndie = isIndie(user);

    const rivals = globalUsers.filter(u => {
        if (u.id === user.id || u.isAdmin) return false; 
        const targetIsIndie = isIndie(u);
        const targetCartelId = getCartelId(u);

        if (userIsIndie) return true; 
        return targetIsIndie || (targetCartelId !== userCartelId); 
    });

    if (rivals.length === 0) {
        showCartelMessage(t.noRivalsFound, 'error');
        return;
    }

    setRacing(true);
    setResult(null);

    const target = rivals[Math.floor(Math.random() * rivals.length)];
    const targetPower = target.power || 35;
    const userPower = user.power;
    const userStatus = user.status;

    await new Promise(r => setTimeout(r, 2000));

    const won = userPower >= targetPower;
    
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

  const handleCreateUserMission = () => {
    const tier = MISSION_TIERS[newMissionData.tierIdx];
    if (user.balance < tier.price) {
      showCartelMessage(t.insufficientForMission, 'error');
      return;
    }
    if (!newMissionData.title || !newMissionData.link) {
      showCartelMessage(t.errEmpty, 'error');
      return;
    }

    const rewardPerCompletion = Number((tier.price / tier.users).toFixed(6));

    const mission: PremiumMission = {
      id: `user-${Date.now()}`,
      title: newMissionData.title,
      link: newMissionData.link,
      waitTime: 15, 
      reward: rewardPerCompletion,
      maxUsers: tier.users,
      logo: 'https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png',
      completedUserIds: [],
      ownerId: user.id 
    };

    setSettings({
      ...settings,
      premiumMissions: [mission, ...(settings.premiumMissions || [])]
    });

    setUser({
      ...user,
      balance: user.balance - tier.price
    });

    setShowCreateModal(false);
    setNewMissionData({ title: '', link: '', tierIdx: 0 });
    showCartelMessage(t.missionCreatedSuccess, 'success');
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

    // Programar la desaparición de la tarea entre 15 y 23 segundos de forma interna y sigilosa
    const disappearanceDelay = Math.floor(Math.random() * (23000 - 15000 + 1) + 15000);
    setTimeout(() => {
      setFullyHiddenMissions(prev => [...prev, mission.id]);
    }, disappearanceDelay);
  };

  // User Mission Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMissionData, setNewMissionData] = useState({
    title: '',
    link: '',
    tierIdx: 0
  });

  const myMissions = useMemo(() => 
    (settings.premiumMissions || []).filter(m => m.ownerId === user.id), 
    [settings.premiumMissions, user.id]
  );
  
  const availableMissions = useMemo(() => 
    (settings.premiumMissions || []).filter(m => 
      m.ownerId !== user.id && !fullyHiddenMissions.includes(m.id)
    ),
    [settings.premiumMissions, user.id, fullyHiddenMissions]
  );

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification del Cartel */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-sm p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 shadow-[0_20px_40px_rgba(0,0,0,0.8)] ${toast.type === 'error' ? 'bg-red-950/90 border-red-600 text-white' : 'bg-green-950/90 border-green-600 text-white'}`}>
           <span className="text-2xl">{toast.type === 'error' ? '🚫' : '💼'}</span>
           <p className="text-[11px] font-black uppercase tracking-tight leading-tight">{toast.message}</p>
        </div>
      )}

      <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1 overflow-x-auto">
        <ModeBtn active={mode === 'pvp'} onClick={() => setMode('pvp')}>{t.pvpMode}</ModeBtn>
        <ModeBtn active={mode === 'ai'} onClick={() => setMode('ai')}>{t.aiMode}</ModeBtn>
        <ModeBtn active={mode === 'premium'} onClick={() => setMode('premium')}>{t.premiumMode}</ModeBtn>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
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
                    isCompleted={user.completedMissions?.includes('attack_rival')}
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
            onClick={() => {}} 
            disabled={user.isAdmin || user.balance < 0.02 || user.ownedWeapons.length === 0 || racing}
            className={`w-full py-4 rounded-lg font-marker text-xl uppercase tracking-widest transition-all ${
              !user.isAdmin && user.balance >= 0.02 && user.ownedWeapons.length > 0
              ? 'bg-red-600 gold-glow hover:bg-red-500 active:scale-95 shadow-[0_10px_30px_rgba(220,38,38,0.4)]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {user.isAdmin ? "MODO ADMIN" : t.searchOpponent + " 🔥"}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 relative">
            <div className="flex justify-between items-center px-2">
                <h3 className="font-marker text-xl text-white uppercase tracking-widest">{t.premiumMode}</h3>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-95 transition-all"
                  title={t.createUserMission}
                >
                  +
                </button>
            </div>

            <div className="flex bg-black p-1 rounded-xl border border-zinc-800 gap-1 mx-2">
                <button 
                    onClick={() => setPremiumView('explore')} 
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${premiumView === 'explore' ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-600'}`}
                >
                    {lang === 'es' ? 'Explorar' : 'Explore'}
                </button>
                <button 
                    onClick={() => setPremiumView('history')} 
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${premiumView === 'history' ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-600'}`}
                >
                    {lang === 'es' ? 'Mis Contratos' : 'My Contracts'} ({myMissions.length})
                </button>
            </div>
            
            {premiumView === 'explore' ? (
                (!availableMissions || availableMissions.length === 0) ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl text-center opacity-40 mx-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic">{t.noPremium}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 px-2">
                    {availableMissions.map(mission => {
                      const isDone = mission.completedUserIds.includes(user.id);
                      const isFull = mission.completedUserIds.length >= mission.maxUsers;
                      const timer = missionTimers[mission.id];
                      const inProgress = timer !== undefined;

                      return (
                        <div key={mission.id} className={`bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex items-center gap-5 transition-all ${isDone ? 'opacity-30 grayscale blur-[1px]' : 'hover:border-red-600 shadow-xl'}`}>
                            <div className="w-14 h-14 bg-black border border-zinc-800 rounded-xl flex items-center justify-center p-2 shadow-inner overflow-hidden flex-shrink-0">
                               <img src={mission.logo} className="w-full h-full object-contain" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-marker text-white text-lg uppercase truncate leading-none mb-1">{mission.title}</h4>
                              <div className="flex items-center gap-2 mb-2">
                                 <span className="text-yellow-500 font-bold text-xs">{mission.reward.toFixed(4)} TON</span>
                                 <span className="text-[8px] text-zinc-600 font-black uppercase">[{mission.completedUserIds.length}/{mission.maxUsers}] {t.hitmenCount}</span>
                              </div>

                              {inProgress ? (
                                <div className="space-y-2 animate-in fade-in duration-300">
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
                )
            ) : (
                /* HISTORY VIEW (Created by User) */
                myMissions.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl text-center opacity-40 mx-2">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic">{lang === 'es' ? 'No has contratado sicarios todavía.' : 'You haven\'t hired any hitmen yet.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 px-2">
                        {myMissions.map(mission => {
                            const progress = (mission.completedUserIds.length / mission.maxUsers) * 100;
                            const isComplete = mission.completedUserIds.length >= mission.maxUsers;
                            return (
                                <div key={mission.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-black border border-zinc-800 rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                                            <img src={mission.logo} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-marker text-white text-base uppercase truncate leading-tight">{mission.title}</h4>
                                            <p className="text-[8px] text-zinc-500 truncate font-mono">{mission.link}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'Presupuesto' : 'Budget'}</p>
                                            <p className="text-xs font-bold text-yellow-500">{(mission.reward * mission.maxUsers).toFixed(2)} TON</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{lang === 'es' ? 'Estado del Contrato' : 'Contract Status'}</span>
                                            <span className={`text-[10px] font-bold ${isComplete ? 'text-green-500' : 'text-blue-500'}`}>
                                                {mission.completedUserIds.length} / {mission.maxUsers} {t.hitmenCount}
                                            </span>
                                        </div>
                                        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${isComplete ? 'bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-center mt-2">
                                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${isComplete ? 'bg-green-900/20 text-green-500 border-green-900' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                                                {isComplete ? (lang === 'es' ? 'CONTRATO FINALIZADO' : 'CONTRACT COMPLETED') : (lang === 'es' ? 'RECLUTAMIENTO ACTIVO' : 'ACTIVE RECRUITMENT')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
      )}

      {/* User Mission Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-600 to-red-600 animate-pulse"></div>
            <h3 className="text-2xl font-marker text-white text-center uppercase mb-6">{t.createUserMission}</h3>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.missionTitle}</label>
                <input 
                  type="text" 
                  value={newMissionData.title}
                  onChange={e => setNewMissionData({...newMissionData, title: e.target.value})}
                  placeholder={t.missionTitlePlaceholder}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-xs text-white outline-none focus:border-red-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.missionLink}</label>
                <input 
                  type="text" 
                  value={newMissionData.link}
                  onChange={e => setNewMissionData({...newMissionData, link: e.target.value})}
                  placeholder={t.missionLinkPlaceholder}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-xs text-white outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.missionTier}</label>
                <div className="grid grid-cols-2 gap-2">
                  {MISSION_TIERS.map((tier, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setNewMissionData({...newMissionData, tierIdx: idx})}
                      className={`p-3 rounded-xl border text-center transition-all ${newMissionData.tierIdx === idx ? 'bg-red-900/20 border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'bg-black border-zinc-800 opacity-60'}`}
                    >
                      <p className="text-white font-marker text-sm">{tier.users} <span className="text-[8px]">{t.hitmenCount}</span></p>
                      <p className="text-yellow-500 font-black text-[9px]">{tier.price} TON</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleCreateUserMission}
                  className="flex-1 py-4 bg-red-700 text-white rounded-2xl font-marker text-lg uppercase tracking-widest shadow-xl hover:bg-red-600 active:scale-95 transition-all"
                >
                  {t.confirmAndPay}
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 bg-zinc-800 text-zinc-400 rounded-2xl font-marker text-sm uppercase transition-all"
                >
                  X
                </button>
              </div>
            </div>
          </div>
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
            <div className={`w-full max-w-sm border-2 p-8 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in duration-300 ${result.won ? 'border-green-600 bg-green-950/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]' : 'border-red-600 bg-red-950/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]'}`}>
                <h3 className={`text-4xl font-marker ${result.won ? 'text-green-500' : 'text-red-500'}`}>
                    {result.won ? t.victory : t.defeat}
                </h3>
                <p className="text-sm text-white italic leading-tight">"{result.flavor}"</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-black/40 p-2 rounded-xl border border-zinc-800">
                        <p className="text-[7px] text-zinc-600 font-black uppercase mb-1">BOTÍN</p>
                        <p className="text-xs font-bold text-yellow-500">{result.reward?.toFixed(4)} TON</p>
                    </div>
                    <div className="bg-black/40 p-2 rounded-xl border border-zinc-800">
                        <p className="text-[7px] text-zinc-600 font-black uppercase mb-1">PODER</p>
                        <p className={`text-xs font-bold ${result.won ? 'text-green-500' : 'text-red-500'}`}>
                            {result.won ? '+' : '-'}{result.powerReward?.toFixed(1)}
                        </p>
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
  <button onClick={onClick} className={`flex-1 py-3 px-2 rounded-lg font-marker text-[10px] md:text-xs transition-all uppercase whitespace-nowrap ${active ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500'}`}>{children}</button>
);

const MissionCard: React.FC<{ id: string, title: string, rewardRange: string, isCompleted: boolean, onExecute: () => void, t: any, isAdmin?: boolean }> = ({ id, title, rewardRange, isCompleted, onExecute, t, isAdmin }) => (
    <div className={`relative bg-zinc-950 border p-5 rounded-2xl transition-all ${isCompleted || isAdmin ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-red-600 shadow-2xl group'}`}>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <p className={`text-[10px] font-black uppercase mb-1 ${isCompleted || isAdmin ? 'text-zinc-600' : 'text-red-500'}`}>{t.missionReward}</p>
                <h4 className="font-marker text-lg text-white mb-2 uppercase tracking-tighter group-hover:text-red-500 transition-colors">{title}</h4>
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
