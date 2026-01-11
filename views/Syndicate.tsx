"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Gang, Rank, CartelWar } from '../types';
import { useGame } from '../context/GameContext';

const Syndicate: React.FC = () => {
  const { user, setUser, t } = useGame();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'members' | 'pending' | 'settings' | 'wars'>('pending');
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [tempLink, setTempLink] = useState('');
  const [tempLogo, setTempLogo] = useState('');
  const [wars, setWars] = useState<CartelWar[]>(() => {
    // Check if window is defined (client-side) before accessing localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cartel_active_wars');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [gangs, setGangs] = useState<Gang[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cartel_gangs');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [newGang, setNewGang] = useState({ name: '', entryFee: 0.05, socialLink: '', logoUrl: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartel_gangs', JSON.stringify(gangs));
    }
  }, [gangs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartel_active_wars', JSON.stringify(wars));
    }
  }, [wars]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEditing) setTempLogo(base64String);
        else setNewGang({ ...newGang, logoUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGang = () => {
    const fee = Math.max(0.05, Math.min(0.2, newGang.entryFee));
    if (user.balance < 10 || !newGang.name.trim() || !newGang.socialLink.trim()) return;

    const id = Date.now().toString();
    const createdGang: Gang = {
      id,
      name: newGang.name,
      owner: user.name,
      entryFee: fee,
      membersCount: 1,
      membersList: [{ name: user.name, rank: Rank.JEFE, joinedAt: new Date(), paidFee: 0 }],
      pendingApplications: [],
      socialLink: newGang.socialLink,
      logoUrl: newGang.logoUrl || 'https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png',
      linkChangeCount: 0,
      logoSet: !!newGang.logoUrl
    };
    setGangs([createdGang, ...gangs]);
    setUser({ ...user, balance: user.balance - 10, myGangId: id, rank: Rank.JEFE });
    setShowCreateForm(false);
  };

  const handleApplyToGang = (gang: Gang) => {
    if (user.balance < gang.entryFee || user.joinedGangId || user.myGangId || user.appliedGangId) return;

    const updatedGangs = gangs.map(g => {
      if (g.id === gang.id) {
        return {
          ...g,
          pendingApplications: [...g.pendingApplications, {
            name: user.name,
            rank: Rank.INDEPENDIENTE,
            joinedAt: new Date(),
            paidFee: gang.entryFee
          }]
        };
      }
      return g;
    });
    setGangs(updatedGangs);

    setUser({
      ...user,
      balance: user.balance - gang.entryFee,
      appliedGangId: gang.id,
      pendingFeeLock: gang.entryFee
    });
  };

  const handleCancelApplication = () => {
    if (!user.appliedGangId) return;

    const targetGangId = user.appliedGangId;
    const refundAmount = user.pendingFeeLock || 0;

    const updatedGangs = gangs.map(g => {
      if (g.id === targetGangId) {
        return {
          ...g,
          pendingApplications: g.pendingApplications.filter(p => p.name !== user.name)
        };
      }
      return g;
    });
    setGangs(updatedGangs);

    setUser({
      ...user,
      balance: user.balance + refundAmount,
      appliedGangId: undefined,
      pendingFeeLock: 0
    });
  };

  const acceptMember = (appName: string) => {
    const gang = gangs.find(g => g.id === user.myGangId);
    if (!gang) return;
    const application = gang.pendingApplications.find(p => p.name === appName);
    if (!application) return;

    const commission = application.paidFee * 0.2;

    setGangs(gangs.map(g => g.id === user.myGangId ? {
      ...g,
      membersCount: g.membersCount + 1,
      membersList: [...g.membersList, { ...application, rank: Rank.RECLUTA }],
      pendingApplications: g.pendingApplications.filter(p => p.name !== appName)
    } : g));

    setUser({ ...user, balance: user.balance + commission });
  };

  const rejectMember = (appName: string) => {
    const gang = gangs.find(g => g.id === user.myGangId);
    if (!gang) return;
    const application = gang.pendingApplications.find(p => p.name === appName);

    setGangs(gangs.map(g => g.id === user.myGangId ? {
      ...g,
      pendingApplications: g.pendingApplications.filter(p => p.name !== appName)
    } : g));

    if (appName === user.name) {
      setUser({ ...user, balance: user.balance + (application?.paidFee || 0), appliedGangId: undefined, pendingFeeLock: 0 });
    }
  };

  const currentGang = gangs.find(g => g.id === user.joinedGangId || g.id === user.myGangId);
  const isOwner = user.myGangId !== undefined && user.rank === Rank.JEFE;

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <h2 className="text-2xl font-marker text-white mb-6 text-center">{t.syndicate}</h2>

        {currentGang ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 p-6 rounded-2xl border border-red-900/30 shadow-inner relative flex flex-col items-center text-center">
              <div className="absolute top-2 right-4 text-[8px] text-zinc-600 font-black uppercase">STATUS: ACTIVE</div>
              <div className="w-24 h-24 rounded-full border-4 border-zinc-800 bg-black/40 mb-4 overflow-hidden flex items-center justify-center p-2 shadow-2xl relative group">
                <img src={currentGang.logoUrl} className="w-full h-full object-contain" alt="Gang Logo" />
                {isOwner && !currentGang.logoSet && (
                  <div onClick={() => setIsEditingLogo(true)} className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-[10px] text-white font-bold">UPLOAD</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-red-500 font-black uppercase mb-1 tracking-widest">{t.myGang}</p>
              <h3 className="text-3xl font-marker text-white mb-2">{currentGang.name}</h3>
              <div className="bg-black/40 px-3 py-1 rounded-full border border-zinc-800 flex items-center gap-2">
                <span className="text-[8px] text-zinc-500 font-black uppercase">{t.entryFeeLabel}:</span>
                <span className="text-xs font-bold text-yellow-500">{currentGang.entryFee} TON</span>
              </div>
            </div>

            {isOwner && (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                <div className="flex gap-2 mb-4 bg-black p-1 rounded-xl">
                  <button onClick={() => setActiveAdminTab('pending')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeAdminTab === 'pending' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>{t.applications} ({currentGang.pendingApplications.length})</button>
                  <button onClick={() => setActiveAdminTab('members')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeAdminTab === 'members' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>{t.members}</button>
                  <button onClick={() => setActiveAdminTab('wars')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeAdminTab === 'wars' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>{t.warTitle}</button>
                </div>

                <div className="space-y-3 min-h-[150px]">
                  {activeAdminTab === 'pending' && (
                    currentGang.pendingApplications.length === 0 ? (
                      <p className="text-center text-zinc-700 text-[10px] py-10 uppercase font-black tracking-widest italic">{t.noApps}</p>
                    ) : (
                      currentGang.pendingApplications.map((app, i) => (
                        <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group">
                          <div>
                            <p className="text-xs font-bold text-white uppercase">{app.name}</p>
                            <p className="text-[9px] text-yellow-600 font-black uppercase tracking-tighter">{app.paidFee} TON</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => acceptMember(app.name)} className="bg-red-700 text-white px-3 py-2 rounded text-[9px] font-black uppercase hover:bg-red-600 transition-colors">{t.accept}</button>
                            <button onClick={() => rejectMember(app.name)} className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded text-[9px] font-black uppercase hover:bg-red-900 hover:text-white transition-all">{t.reject}</button>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {activeAdminTab === 'members' && currentGang.membersList.map((member, i) => (
                    <div key={i} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-[10px]">👤</div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{member.name}</p>
                          <p className="text-[8px] text-zinc-500 uppercase">{member.rank}</p>
                        </div>
                      </div>
                      <span className="text-[8px] text-zinc-700 font-black uppercase">JOINED {new Date(member.joinedAt).toLocaleDateString()}</span>
                    </div>
                  ))}

                  {activeAdminTab === 'wars' && (
                    <div className="p-4 text-center">
                      <p className="text-red-500 font-marker text-lg mb-2 uppercase">{t.warTitle}</p>
                      <p className="text-[9px] text-zinc-500 uppercase leading-relaxed mb-4">{t.higherPowerWins}</p>
                      <button className="w-full py-3 bg-red-900/20 border border-red-900/50 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-900 hover:text-white transition-all">{t.rivalScan}</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-center py-10 px-6 border-2 border-dashed border-zinc-800 rounded-2xl bg-black/10">
              <p className="text-sm italic text-zinc-600">{user.appliedGangId ? t.waitingApproval : t.noGang}</p>
            </div>

            {user.appliedGangId && (
              <div className="bg-yellow-900/10 border border-yellow-700/30 p-5 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] text-yellow-600 font-black uppercase mb-2 tracking-[0.2em]">{t.pendingApplication}</p>
                <button
                  onClick={handleCancelApplication}
                  className="w-full py-3 bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-zinc-700 hover:border-red-600"
                >
                  {t.cancelApplication}
                </button>
              </div>
            )}

            {!showCreateForm && !user.appliedGangId && (
              <button onClick={() => setShowCreateForm(true)} className="w-full py-5 rounded-2xl bg-yellow-600 text-black font-marker uppercase tracking-widest text-xl shadow-[0_10px_30px_rgba(202,138,4,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                {t.createGang} (10 TON)
              </button>
            )}
          </div>
        )}

        {showCreateForm && (
          <div className="space-y-5 bg-black/40 p-6 rounded-3xl border border-yellow-600/30 animate-in slide-in-from-bottom-4 shadow-2xl">
            <h4 className="font-marker text-yellow-500 text-center text-xl uppercase tracking-tighter">{t.foundNewCartel}</h4>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-zinc-800 overflow-hidden flex items-center justify-center relative">
                  {newGang.logoUrl ? <img src={newGang.logoUrl} className="w-full h-full object-contain" /> : <span className="text-2xl opacity-20">🏴‍☠️</span>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">{t.selectEmblem}</button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, false)} />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 font-black uppercase ml-1">{t.orgNameLabel}</label>
                <input type="text" placeholder="Ej: Los Hermanos" value={newGang.name} onChange={e => setNewGang({ ...newGang, name: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm text-white outline-none focus:border-yellow-600" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 font-black uppercase ml-1">{t.entryFeeLabel} (0.05 - 0.20 TON)</label>
                <input type="number" step="0.01" min="0.05" max="0.2" value={newGang.entryFee} onChange={e => setNewGang({ ...newGang, entryFee: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm text-white outline-none focus:border-yellow-600 font-bold" />
                <p className="text-[7px] text-zinc-600 font-bold uppercase mt-1 italic">{t.commNotice}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 font-black uppercase ml-1">{t.socialCommLabel}</label>
                <input type="text" placeholder="t.me/TuGrupo" value={newGang.socialLink} onChange={e => setNewGang({ ...newGang, socialLink: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm text-white outline-none focus:border-yellow-600" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleCreateGang} className="flex-1 bg-red-700 py-4 rounded-xl font-marker uppercase tracking-widest text-sm shadow-xl hover:bg-red-600 active:scale-95 transition-all">{t.fundBtn}</button>
              <button onClick={() => setShowCreateForm(false)} className="px-6 bg-zinc-800 rounded-xl font-marker uppercase text-xs hover:bg-zinc-700 transition-all">X</button>
            </div>
          </div>
        )}

        {!currentGang && !showCreateForm && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-zinc-800"></div>
              <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] whitespace-nowrap">{t.underworldGangs}</h3>
              <div className="h-[1px] flex-1 bg-zinc-800"></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {gangs.map(g => (
                <div key={g.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center group hover:border-red-900/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-black border border-zinc-900 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                      <img src={g.logoUrl || 'https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png'} className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="Logo" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight group-hover:text-red-500 transition-colors uppercase italic">"{g.name}"</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter">{g.membersCount} {t.soldiers}</span>
                        <span className="text-[7px] text-yellow-700 font-black uppercase tracking-tighter">{t.joinGang}: {g.entryFee} TON</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyToGang(g)}
                    disabled={user.balance < g.entryFee || !!user.appliedGangId || !!user.myGangId || !!user.joinedGangId}
                    className={`px-5 py-2.5 rounded-xl font-marker text-[9px] uppercase tracking-widest transition-all ${user.appliedGangId === g.id
                        ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600 cursor-not-allowed animate-pulse'
                        : user.balance < g.entryFee
                          ? 'bg-zinc-900 text-zinc-700 opacity-50 cursor-not-allowed'
                          : 'bg-red-700 text-white hover:bg-red-600 shadow-lg'
                      }`}
                  >
                    {user.appliedGangId === g.id ? 'PENDING' : t.joinGang}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Syndicate;
