
import React, { useState, useRef } from 'react';
import { UserProfile, Transaction, GlobalSettings, Rank, PremiumMission } from '../types';
import { useTranslation } from '../App';

interface Props {
  user: UserProfile;
  users: UserProfile[];
  setUsers: (u: UserProfile[]) => void;
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  settings: GlobalSettings;
  setSettings: (s: GlobalSettings) => void;
}

const Admin: React.FC<Props> = ({ user, users, setUsers, transactions, setTransactions, settings, setSettings }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'settings' | 'premium'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>({});
  
  // Usamos strings para el estado del formulario para permitir escribir decimales sin problemas
  const [newMission, setNewMission] = useState({
    title: '',
    link: '',
    waitTime: '60',
    reward: '0.1',
    maxUsers: '100',
    logo: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user.isAdmin) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
            <h1 className="text-red-600 font-marker text-3xl uppercase">{t.adminOnly}</h1>
        </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMission({ ...newMission, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const createMission = () => {
    if (!newMission.title || !newMission.link || !newMission.logo) {
      alert("Faltan datos para la misión");
      return;
    }

    const rewardVal = parseFloat(newMission.reward);
    if (isNaN(rewardVal) || rewardVal <= 0) {
      alert("La recompensa debe ser un número válido mayor a 0");
      return;
    }

    const mission: PremiumMission = {
      id: Date.now().toString(),
      title: newMission.title,
      link: newMission.link,
      waitTime: parseInt(newMission.waitTime) || 60,
      reward: rewardVal, // Ahora acepta cualquier valor decimal (ej. 0.0001)
      maxUsers: parseInt(newMission.maxUsers) || 100,
      logo: (newMission.logo as string),
      completedUserIds: []
    };

    setSettings({ ...settings, premiumMissions: [mission, ...(settings.premiumMissions || [])] });
    setNewMission({ title: '', link: '', waitTime: '60', reward: '0.1', maxUsers: '100', logo: '' });
    alert("Misión creada con éxito");
  };

  const deleteMission = (id: string) => {
    setSettings({ ...settings, premiumMissions: settings.premiumMissions.filter(m => m.id !== id) });
  };

  const filteredUsers = users.filter(u => 
    u.id.includes(searchTerm) || 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingDeposits = transactions.filter(tx => tx.type === 'deposit' && tx.status === 'pending');
  const pendingWithdrawals = transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending');

  const totalDeposited = transactions
    .filter(tx => tx.type === 'deposit' && tx.status === 'approved')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalWithdrawn = transactions
    .filter(tx => tx.type === 'withdrawal' && tx.status === 'approved')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const handleBalanceInputChange = (userId: string, value: string) => {
    setBalanceInputs(prev => ({ ...prev, [userId]: value }));
  };

  const adjustBalance = (targetUserId: string, isGive: boolean) => {
    const amount = parseFloat(balanceInputs[targetUserId] || '0');
    if (isNaN(amount) || amount <= 0) return;

    setUsers(users.map(u => {
      if (u.id === targetUserId) {
        const newBalance = isGive ? u.balance + amount : Math.max(0, u.balance - amount);
        return { ...u, balance: Number(newBalance.toFixed(6)) };
      }
      return u;
    }));
    setBalanceInputs(prev => ({ ...prev, [targetUserId]: '' }));
    alert(isGive ? `Inyectados ${amount} TON` : `Confiscados ${amount} TON`);
  };

  const toggleBan = (targetUserId: string) => {
    setUsers(users.map(u => u.id === targetUserId ? { ...u, isBanned: !u.isBanned } : u));
  };

  const processTx = (txId: string, status: 'approved' | 'rejected') => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    if (status === 'approved') {
        if (tx.type === 'deposit') {
            const nextUsers = [...users];
            const uIndex = nextUsers.findIndex(u => u.id === tx.userId);
            if (uIndex >= 0) {
                const depositor = nextUsers[uIndex];
                nextUsers[uIndex] = { ...depositor, balance: Number((depositor.balance + tx.amount).toFixed(6)) };

                if (depositor.referredBy) {
                    const rIndex = nextUsers.findIndex(u => u.id === depositor.referredBy);
                    if (rIndex >= 0) {
                        const commission = tx.amount * (settings.referralCommissionPercent / 100);
                        nextUsers[rIndex] = { 
                            ...nextUsers[rIndex], 
                            balance: Number((nextUsers[rIndex].balance + commission).toFixed(6)) 
                        };
                    }
                }
            }
            setUsers(nextUsers);
        }
    } else {
        if (tx.type === 'withdrawal') {
            setUsers(users.map(u => u.id === tx.userId ? { ...u, balance: Number((u.balance + tx.amount + 0.1).toFixed(6)) } : u));
        }
    }

    setTransactions(transactions.map(t => t.id === txId ? { ...t, status } : t));
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-marker text-red-600 text-center uppercase tracking-widest">{t.adminPanel}</h2>

      <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 overflow-x-auto gap-1">
        <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Hitmen</TabBtn>
        <TabBtn active={activeTab === 'deposits'} onClick={() => setActiveTab('deposits')}>
          DEP <span className={pendingDeposits.length > 0 ? 'text-red-500 animate-pulse' : ''}>({pendingDeposits.length})</span>
        </TabBtn>
        <TabBtn active={activeTab === 'withdrawals'} onClick={() => setActiveTab('withdrawals')}>
          WDR <span className={pendingWithdrawals.length > 0 ? 'text-yellow-500 animate-pulse' : ''}>({pendingWithdrawals.length})</span>
        </TabBtn>
        <TabBtn active={activeTab === 'premium'} onClick={() => setActiveTab('premium')}>PREMIUM</TabBtn>
        <TabBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>NET</TabBtn>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <input 
                type="text" 
                placeholder={t.userSearch} 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs text-white outline-none focus:border-red-600"
            />

            <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map(u => (
                    <div key={u.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-white uppercase">{u.name} <span className="text-[10px] text-zinc-600 font-normal">#{u.id}</span></p>
                                <p className="text-[9px] text-zinc-500">{u.email}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${u.isBanned ? 'bg-red-900/20 text-red-500 border border-red-900' : 'bg-green-900/20 text-green-500 border border-green-900'}`}>
                                {u.isBanned ? 'BANEADO' : 'ACTIVO'}
                            </div>
                        </div>

                        <div className="flex gap-4 border-t border-zinc-900 pt-3">
                            <div className="text-center">
                                <p className="text-[8px] text-zinc-600 font-black uppercase">TON</p>
                                <p className="text-xs text-yellow-500 font-bold">{u.balance.toFixed(4)}</p>
                            </div>
                            {u.referredBy && (
                                <div className="text-center">
                                    <p className="text-[8px] text-zinc-600 font-black uppercase">Reclutado Por</p>
                                    <p className="text-[10px] text-white font-mono">#{u.referredBy}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 bg-black/30 p-3 rounded-xl border border-zinc-900">
                            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-2">Ajuste de Saldo Libre</p>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    step="any"
                                    placeholder="0.00"
                                    value={balanceInputs[u.id] || ''}
                                    onChange={e => handleBalanceInputChange(u.id, e.target.value)}
                                    className="flex-1 bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-white outline-none focus:border-red-600"
                                />
                                <button onClick={() => adjustBalance(u.id, true)} className="bg-green-700 text-white text-[9px] px-3 py-1 rounded font-black hover:bg-green-600">DAR</button>
                                <button onClick={() => adjustBalance(u.id, false)} className="bg-red-700 text-white text-[9px] px-3 py-1 rounded font-black hover:bg-red-600">QUITAR</button>
                            </div>
                        </div>

                        <button onClick={() => toggleBan(u.id)} className={`w-full text-[8px] font-black px-3 py-2 rounded-lg border transition-all ${u.isBanned ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
                            {u.isBanned ? t.unban : t.ban}
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'premium' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-marker text-white uppercase text-center">{t.createPremium}</h3>
            
            <div className="flex flex-col items-center mb-4">
               <div className="w-16 h-16 bg-black border border-zinc-800 rounded-xl mb-2 overflow-hidden flex items-center justify-center p-2 shadow-inner">
                  {newMission.logo ? <img src={newMission.logo} className="w-full h-full object-contain" /> : <span className="opacity-10 text-3xl">🪪</span>}
               </div>
               <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-blue-500 font-bold uppercase underline">Subir Logo</button>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <AdminInput label={t.missionTitle} value={newMission.title} onChange={v => setNewMission({...newMission, title: v})} />
              <AdminInput label={t.missionLink} value={newMission.link} onChange={v => setNewMission({...newMission, link: v})} />
              <div className="grid grid-cols-3 gap-2">
                <AdminInput label={t.missionTime} type="number" value={newMission.waitTime} onChange={v => setNewMission({...newMission, waitTime: v})} />
                <AdminInput label={t.missionRewardVal} type="number" step="any" value={newMission.reward} onChange={v => setNewMission({...newMission, reward: v})} />
                <AdminInput label={t.missionUsers} type="number" value={newMission.maxUsers} onChange={v => setNewMission({...newMission, maxUsers: v})} />
              </div>
              <button onClick={createMission} className="w-full py-4 bg-green-700 text-white rounded-xl font-marker uppercase tracking-widest mt-2">{t.createPremium}</button>
            </div>
          </div>

          <div className="space-y-3">
            {settings.premiumMissions?.map(m => (
              <div key={m.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                <img src={m.logo} className="w-10 h-10 object-contain rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-xs uppercase truncate">{m.title}</p>
                  <p className="text-[8px] text-zinc-500 truncate">{m.link}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[7px] bg-yellow-900/20 text-yellow-500 border border-yellow-900 px-1.5 rounded">{m.reward} TON</span>
                    <span className="text-[7px] bg-zinc-900 text-zinc-400 px-1.5 rounded">{m.completedUserIds.length} / {m.maxUsers}</span>
                  </div>
                </div>
                <button onClick={() => deleteMission(m.id)} className="text-red-500 font-bold text-lg p-2">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'deposits' || activeTab === 'withdrawals') && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-3">
                    {(activeTab === 'deposits' ? pendingDeposits : pendingWithdrawals).length === 0 ? (
                        <p className="text-center py-20 text-zinc-700 font-black uppercase text-[10px] tracking-widest italic">No hay solicitudes pendientes</p>
                    ) : (
                        (activeTab === 'deposits' ? pendingDeposits : pendingWithdrawals).map(tx => (
                            <div key={tx.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center group hover:border-zinc-700 transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[10px] font-bold text-white uppercase">{tx.userName}</p>
                                        <span className="text-[8px] text-zinc-600 font-mono">#{tx.userId}</span>
                                    </div>
                                    <p className={`text-lg font-marker ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>{tx.amount} {tx.currency}</p>
                                    <div className="bg-black/50 p-2 rounded mt-2 border border-zinc-900">
                                        <p className="text-[7px] text-zinc-500 font-black uppercase mb-1">{tx.type === 'deposit' ? 'TXID RECLAMADO' : 'DIRECCIÓN DE RETIRO'}</p>
                                        <p className="text-[7px] text-zinc-400 font-mono break-all leading-tight">{tx.txid}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 ml-4">
                                    <button onClick={() => processTx(tx.id, 'approved')} className="bg-green-700 text-white text-[9px] font-black uppercase px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20">APROBAR</button>
                                    <button onClick={() => processTx(tx.id, 'rejected')} className="bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase px-4 py-2.5 rounded-lg hover:bg-red-900 hover:text-white transition-all">RECHAZAR</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
          </div>
      )}

      {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center">
                      <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Mercado Negro (Swap)</h4>
                          <p className="text-[9px] text-zinc-600 font-black uppercase">Permitir CWARS -> TON</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, swapEnabled: !settings.swapEnabled})}
                        className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${settings.swapEnabled ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-zinc-800 text-zinc-500'}`}
                      >
                        {settings.swapEnabled ? 'ACTIVO' : 'CERRADO'}
                      </button>
                  </div>

                  <div className="flex justify-between items-center border-t border-zinc-900 pt-4">
                      <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Canales de Retiro</h4>
                          <p className="text-[9px] text-zinc-600 font-black uppercase">Permitir salidas de capital a TON</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, withdrawalEnabled: !settings.withdrawalEnabled})}
                        className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${settings.withdrawalEnabled ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-zinc-800 text-zinc-500'}`}
                      >
                        {settings.withdrawalEnabled ? 'ACTIVO' : 'CERRADO'}
                      </button>
                  </div>

                  <div className="flex justify-between items-center border-t border-zinc-900 pt-4">
                      <div className="flex-1">
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Comisión por Recluta</h4>
                          <p className="text-[9px] text-zinc-600 font-black uppercase">Porcentaje ganado por cada depósito del referido</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1" 
                            max="50"
                            value={settings.referralCommissionPercent}
                            onChange={(e) => setSettings({...settings, referralCommissionPercent: parseInt(e.target.value) || 0})}
                            className="w-16 bg-black border border-zinc-800 p-2 rounded-lg text-center font-marker text-lg text-yellow-500"
                          />
                          <span className="text-lg text-zinc-600 font-bold">%</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                      <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">TON Depositado</p>
                      <p className="text-xl font-marker text-green-500">{totalDeposited.toFixed(2)}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                      <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">TON Retirado</p>
                      <p className="text-xl font-marker text-red-500">{totalWithdrawn.toFixed(2)}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                      <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">Sicarios en Base</p>
                      <p className="text-xl font-marker text-white">{users.length}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                      <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">Operaciones Totales</p>
                      <p className="text-xl font-marker text-white">{transactions.length}</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const TabBtn: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`flex-1 min-w-[60px] py-3 rounded-xl text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1 ${active ? 'bg-red-900 text-white' : 'text-zinc-600'}`}>
    {children}
  </button>
);

const AdminInput: React.FC<{ label: string, value: string, onChange: (v: string) => void, type?: string, step?: string }> = ({ label, value, onChange, type = "text", step }) => (
  <div className="space-y-1">
    <label className="text-[8px] text-zinc-500 font-black uppercase ml-1">{label}</label>
    <input 
      type={type} 
      step={step}
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs text-white outline-none focus:border-red-600" 
    />
  </div>
);

export default Admin;
