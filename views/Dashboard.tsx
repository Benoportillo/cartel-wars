'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Rank, Weapon, WeaponInstance, GlobalSettings, Transaction } from '../types';
import { WEAPONS } from '../constants';
import { getMafiaFlavor } from '../geminiService';
import { useGame, useTranslation } from '../context/GameContext';

const CARTEL_WALLET = "UQAYp__Liik27w09kXZbIze8WFUpw1U3DQE2p5azzjCuZM4L";
const BOT_USERNAME = "CartelWar_bot";
const APP_NAME = "cartel"; // ⚠️ IMPORTANTE: Debes crear esto en BotFather con /newapp y poner este nombre exacto

const Dashboard: React.FC = () => {
  const { user, setUser, settings, logout: onLogout, t, lang } = useGame();
  const [flavor, setFlavor] = useState("...");
  const [activeTab, setActiveTab] = useState<'garage' | 'street' | 'swap'>('garage');
  const [newName, setNewName] = useState("");
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedWeaponToBuy, setSelectedWeaponToBuy] = useState<Weapon | null>(null);

  // Deposit Flow State
  const [depositAmount, setDepositAmount] = useState<number>(1);
  const [depositTxid, setDepositTxid] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [showReferralInfo, setShowReferralInfo] = useState(false);

  // Swap State
  const [swapAmount, setSwapAmount] = useState(100);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<string>("1.0");
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  const lastFetchedRank = useRef<Rank | null>(null);

  // Generamos el "Direct Link" que abre la app directamente (sin pasar por el chat)
  // Formato: https://t.me/botname/appname?startapp=ref123
  const referralLink = `https://t.me/${BOT_USERNAME}/${APP_NAME}?startapp=${user.telegramId || user.id}`;

  useEffect(() => {
    if (lastFetchedRank.current !== user.rank) {
      getMafiaFlavor('intro', lang, `User rank: ${user.rank}`).then(setFlavor);
      lastFetchedRank.current = user.rank;
    }
  }, [user.rank, lang]);

  useEffect(() => {
    if (!settings.swapEnabled && activeTab === 'swap') {
      setActiveTab('garage');
    }
  }, [settings.swapEnabled, activeTab]);

  const handleClaim = () => {
    if (user.unclaimedFarming <= 0) return;
    const amount = user.unclaimedFarming;
    setUser({
      ...user,
      balance: user.balance + amount,
      unclaimedFarming: 0,
      lastClaimDate: new Date()
    });
    getMafiaFlavor('claim', lang, `Amount: ${amount}`).then(setFlavor);
  };

  const handleNameChange = () => {
    if (!newName.trim() || user.nameChanged) return;
    setUser({
      ...user,
      name: newName.trim().slice(0, 15),
      nameChanged: true
    });
    setShowNameEdit(false);
  };

  const buyWeapon = (weapon: Weapon) => {
    if (user.balance < weapon.price) {
      setSelectedWeaponToBuy(weapon);
      setShowDepositModal(true);
      return;
    }
    const newInstance: WeaponInstance = {
      weaponId: weapon.id,
      caliberLevel: 1,
      magazineLevel: 1,
      accessoryLevel: 1,
      skin: '#333333'
    };
    setUser({
      ...user,
      balance: user.balance - weapon.price,
      ownedWeapons: [...user.ownedWeapons, newInstance]
    });
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(CARTEL_WALLET);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const processDeposit = () => {
    if (!depositTxid.trim()) {
      alert(t.errEmpty);
      return;
    }

    const savedTxs = localStorage.getItem('cartel_txs');
    const txs: Transaction[] = savedTxs ? JSON.parse(savedTxs) : [];

    // Check for duplicate TXID
    const isDuplicate = txs.some(tx => tx.txid.toLowerCase() === depositTxid.trim().toLowerCase());
    if (isDuplicate) {
      alert(t.duplicateTxidErr);
      return;
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      type: 'deposit',
      amount: depositAmount,
      currency: 'TON',
      txid: depositTxid.trim(),
      status: 'pending',
      timestamp: Date.now()
    };

    localStorage.setItem('cartel_txs', JSON.stringify([tx, ...txs]));

    setShowDepositModal(false);
    setSelectedWeaponToBuy(null);
    setDepositTxid("");
    alert(t.depositReview);
  };

  const handleSwap = () => {
    if (user.cwarsBalance < swapAmount) {
      alert(t.insufficientCwars);
      return;
    }
    const usdtValue = swapAmount / 1000;
    setUser({
      ...user,
      cwarsBalance: user.cwarsBalance - swapAmount,
      balance: user.balance + usdtValue
    });
    alert(`${t.swapSuccess} Recibiste ${usdtValue.toFixed(2)} TON equivalente.`);
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 1.0) {
      alert(t.withdrawLimit);
      return;
    }
    if (!withdrawAddress.trim()) {
      alert(t.invalidAddress);
      return;
    }
    if (user.balance < amount + 0.1) {
      alert(t.insufficientFunds);
      return;
    }

    setIsProcessingWithdrawal(true);

    // Simular procesamiento de 2 segundos para feedback visual
    setTimeout(() => {
      const tx: Transaction = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        type: 'withdrawal',
        amount: amount,
        currency: 'TON',
        txid: withdrawAddress.trim(),
        status: 'pending',
        timestamp: Date.now()
      };

      const savedTxs = localStorage.getItem('cartel_txs');
      const txs = savedTxs ? JSON.parse(savedTxs) : [];
      localStorage.setItem('cartel_txs', JSON.stringify([tx, ...txs]));

      setUser({
        ...user,
        balance: user.balance - (amount + 0.1)
      });

      setIsProcessingWithdrawal(false);
      setWithdrawAmount("1.0");
      setWithdrawAddress("");
      alert(t.withdrawSuccess);
    }, 2000);
  };

  const isInGang = !!(user.myGangId || user.joinedGangId);

  return (
    <div className="space-y-6">
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <img src="https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png" className="w-24 rotate-12" />
        </div>

        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">{t.criminalRecord}</h2>
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-marker text-white tracking-tighter italic">"{user.name}"</h3>
              {!user.nameChanged && !showNameEdit && (
                <button
                  onClick={() => setShowNameEdit(true)}
                  className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded hover:text-white transition-colors"
                >
                  ✎
                </button>
              )}
            </div>
            {showNameEdit && (
              <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-left-2">
                <input
                  type="text"
                  maxLength={15}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nuevo Apodo"
                  className="bg-black border border-zinc-700 p-2 text-xs text-white rounded outline-none focus:border-red-600 w-32"
                />
                <button
                  onClick={handleNameChange}
                  className="bg-red-600 text-white text-[10px] font-black uppercase px-3 rounded hover:bg-red-500"
                >
                  {t.accept}
                </button>
              </div>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className="text-red-600 font-marker text-xl uppercase animate-pulse">{user.rank}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatBox label={t.power} value={user.power.toFixed(2)} color="text-red-500" icon="💀" />
          <StatBox label={t.status} value={user.status.toFixed(0)} color="text-blue-500" icon="👑" />
          <StatBox label="Mafiosos" value={user.referrals.toString()} color="text-zinc-400" icon="👥" />
        </div>
      </section>

      {/* REFERRAL SYSTEM SECTION */}
      {/* REFERRAL SYSTEM SECTION */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="text-6xl">📣</span>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">{t.referralSystemTitle}</h2>
            <button
              onClick={() => setShowReferralInfo(true)}
              className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[8px] hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
            >
              ?
            </button>
          </div>
          <p className="text-[9px] text-zinc-500 uppercase font-bold max-w-[90%] leading-relaxed">{t.referralDescription}</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <div className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-[9px] text-zinc-400 font-mono break-all pr-12 shadow-inner group-hover:border-red-900/50 transition-colors">
              {referralLink}
            </div>
            <button
              onClick={copyReferralLink}
              className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-red-500 hover:text-white hover:bg-red-600 transition-all active:scale-90"
            >
              {isLinkCopied ? "✔️" : "🔗"}
            </button>
            {isLinkCopied && <span className="absolute -top-6 right-0 text-[8px] text-green-500 font-black uppercase animate-bounce">{t.copied}</span>}
          </div>

          <button
            onClick={copyReferralLink}
            className="w-full py-3 bg-zinc-100 text-black rounded-xl font-marker text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl"
          >
            {t.copyLink}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-[7px] text-zinc-600 font-black uppercase">Nivel 1 (7%)</p>
            <p className="text-sm font-marker text-white">{user.referralStats?.level1Count || 0}</p>
            <p className="text-[8px] text-yellow-600 font-bold">{(user.referralStats?.level1Earnings || 0).toFixed(2)} TON</p>
          </div>
          <div className="text-center border-l border-zinc-800">
            <p className="text-[7px] text-zinc-600 font-black uppercase">Nivel 2 (2%)</p>
            <p className="text-sm font-marker text-white">{user.referralStats?.level2Count || 0}</p>
            <p className="text-[8px] text-yellow-600 font-bold">{(user.referralStats?.level2Earnings || 0).toFixed(2)} TON</p>
          </div>
          <div className="text-center border-l border-zinc-800">
            <p className="text-[7px] text-zinc-600 font-black uppercase">Nivel 3 (1%)</p>
            <p className="text-sm font-marker text-white">{user.referralStats?.level3Count || 0}</p>
            <p className="text-[8px] text-yellow-600 font-bold">{(user.referralStats?.level3Earnings || 0).toFixed(2)} TON</p>
          </div>
        </div>
      </section>

      {/* Referral Info Modal */}
      {showReferralInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setShowReferralInfo(false)}>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-marker text-white text-center uppercase mb-4">Comisiones de Red</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center text-red-500 font-black text-lg border border-red-900/30">7%</div>
                <div>
                  <p className="text-white font-bold text-sm uppercase">Nivel 1</p>
                  <p className="text-[10px] text-zinc-500">Tus reclutas directos.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center text-yellow-500 font-black text-lg border border-yellow-900/30">2%</div>
                <div>
                  <p className="text-white font-bold text-sm uppercase">Nivel 2</p>
                  <p className="text-[10px] text-zinc-500">Reclutas de tus reclutas.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-500 font-black text-lg border border-blue-900/30">1%</div>
                <div>
                  <p className="text-white font-bold text-sm uppercase">Nivel 3</p>
                  <p className="text-[10px] text-zinc-500">La red extendida.</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowReferralInfo(false)} className="w-full mt-6 py-3 bg-zinc-800 text-white rounded-xl font-marker text-sm uppercase hover:bg-zinc-700 transition-all">
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800/50 shadow-inner">
        <button onClick={() => setActiveTab('garage')} className={`flex-1 py-3 rounded-xl font-marker text-[10px] tracking-widest transition-all ${activeTab === 'garage' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500'}`}>{t.myGarage}</button>
        <button onClick={() => setActiveTab('street')} className={`flex-1 py-3 rounded-xl font-marker text-[10px] tracking-widest transition-all ${activeTab === 'street' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500'}`}>{t.street}</button>
        {settings.swapEnabled && (
          <button onClick={() => setActiveTab('swap')} className={`flex-1 py-3 rounded-xl font-marker text-[10px] tracking-widest transition-all ${activeTab === 'swap' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500'}`}>SWAP & OUT</button>
        )}
      </div>

      {activeTab === 'garage' ? (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4">
          {user.ownedWeapons.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl opacity-30">
              <p className="font-marker text-xl uppercase">{t.arsenalEmpty}</p>
            </div>
          ) : (
            user.ownedWeapons.map((instance, idx) => {
              const weapon = WEAPONS.find(w => w.id === instance.weaponId);
              if (!weapon) return null;
              const totalPower = (weapon.firepower * 100) + (instance.caliberLevel + instance.magazineLevel + instance.accessoryLevel - 3) * 8;
              const totalRespect = weapon.statusBonus + (instance.caliberLevel + instance.magazineLevel + instance.accessoryLevel - 3) * 5;
              return (
                <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex gap-6 items-center hover:border-red-600 transition-colors">
                  <img src={weapon.image} className="w-24 h-24 object-contain filter drop-shadow-[0_8px_12px_rgba(220,38,38,0.3)]" />
                  <div className="flex-1">
                    <h4 className="font-marker text-zinc-100 text-xl uppercase tracking-tighter">{weapon.name}</h4>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-red-500 font-bold text-xs flex items-center gap-1">💀 {totalPower.toFixed(2)} <span className="text-[8px] opacity-60 uppercase">{t.power}</span></p>
                      <p className="text-blue-500 font-bold text-xs flex items-center gap-1">👑 {totalRespect.toFixed(0)} <span className="text-[8px] opacity-60 uppercase">{t.status}</span></p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'street' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-center mb-2">
            <button onClick={() => setShowDepositModal(true)} className="bg-yellow-600/20 border border-yellow-600/50 text-yellow-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-600 hover:text-black transition-all">
              LAVAR ACTIVOS 🤵‍♂️
            </button>
          </div>

          {WEAPONS.filter(w => w.id !== 'starter').map(weapon => (
            <div key={weapon.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col group hover:border-zinc-600 transition-all">
              <div className="h-48 w-full relative bg-zinc-950 flex items-center justify-center">
                <img src={weapon.image} className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-xl font-black text-sm shadow-xl">{weapon.price} TON</div>
              </div>
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-marker text-white text-lg uppercase">{weapon.name}</h4>
                  <div className="flex flex-col items-end">
                    <p className="text-red-500 font-bold text-[10px] uppercase">💀 {(weapon.firepower * 100).toFixed(0)} {t.power}</p>
                    <p className="text-blue-500 font-bold text-[10px] uppercase">👑 {weapon.statusBonus} {t.status}</p>
                  </div>
                </div>
                <button onClick={() => buyWeapon(weapon)} className="w-full py-3 bg-red-600 text-white rounded-xl font-marker text-xs tracking-widest uppercase hover:bg-red-500 transition-all shadow-lg active:scale-95">{t.buyFor}</button>
              </div>
            </div>
          ))}
        </div>
      ) : settings.swapEnabled ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center">
            <h3 className="text-white font-marker text-xl mb-1">{t.swapTitle}</h3>
            <p className="text-zinc-500 text-[9px] font-black uppercase mb-6 tracking-widest">{t.swapNotice}</p>

            <div className="space-y-4">
              <div className="bg-black/40 border border-zinc-800 p-4 rounded-2xl">
                <label className="text-[9px] text-zinc-500 font-black uppercase mb-2 block">CWARS</label>
                <input
                  type="number"
                  value={swapAmount}
                  onChange={e => setSwapAmount(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-center text-white text-xl font-marker outline-none"
                />
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-zinc-600 text-[9px] font-black">≈</span>
                  <span className="text-yellow-500 font-bold">{(swapAmount / 1000).toFixed(2)} TON</span>
                </div>
              </div>
              <button
                onClick={handleSwap}
                className="w-full py-4 bg-zinc-100 text-black rounded-2xl font-marker text-lg uppercase tracking-widest shadow-xl gold-glow transition-all"
              >
                CAMBIAR CWARS
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center">
            <h3 className="text-white font-marker text-xl mb-1">{t.withdrawal}</h3>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-[9px] text-zinc-500 font-black uppercase">{t.withdrawMin}</span>
              <span className="text-[9px] text-red-500 font-black uppercase">{t.withdrawFee}</span>
            </div>

            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase ml-1">{t.tonAddress}</label>
                <input
                  type="text"
                  placeholder="UQ..."
                  value={withdrawAddress}
                  onChange={e => setWithdrawAddress(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-xs text-white outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase ml-1">Monto TON</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-lg font-marker text-white outline-none focus:border-red-600 pr-16"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center text-[10px] font-black text-zinc-600">TON</div>
                </div>
              </div>

              <button
                onClick={handleWithdrawal}
                disabled={isProcessingWithdrawal}
                className={`w-full py-5 rounded-2xl font-marker text-lg uppercase tracking-widest transition-all ${isProcessingWithdrawal ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-red-700 text-white hover:bg-red-600 shadow-xl'
                  }`}
              >
                {isProcessingWithdrawal ? t.withdrawProcessing : t.withdrawBtn}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* NEW DEPOSIT MODAL WITH FIXED WALLET FLOW */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600/30"></div>

            <h3 className="text-xl font-marker text-white text-center uppercase mb-2">{t.depositTitle}</h3>
            <p className="text-[9px] text-zinc-500 text-center uppercase font-bold leading-relaxed mb-8 px-4">
              {t.depositInstruction}
            </p>

            <div className="space-y-6">
              {/* Fixed Wallet Display */}
              <div className="space-y-2">
                <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.walletAddressLabel}</label>
                <div className="relative group">
                  <div className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-[10px] text-white font-mono break-all pr-12 shadow-inner">
                    {CARTEL_WALLET}
                  </div>
                  <button
                    onClick={copyWallet}
                    className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center bg-zinc-900/80 border border-zinc-700 rounded-xl text-yellow-500 hover:text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-lg"
                  >
                    {isCopied ? "✔️" : "⛓️"}
                  </button>
                  {isCopied && <span className="absolute -top-6 right-0 text-[8px] text-green-500 font-black uppercase animate-bounce">{t.copied}</span>}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.amountLabel}</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={depositAmount}
                    onChange={e => setDepositAmount(parseFloat(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-lg font-marker text-white outline-none focus:border-yellow-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 font-black uppercase tracking-widest ml-1">{t.txidLabel}</label>
                  <input
                    type="text"
                    placeholder={t.txidPlaceholder}
                    value={depositTxid}
                    onChange={e => setDepositTxid(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-[10px] text-white outline-none focus:border-yellow-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={processDeposit} className="flex-1 py-5 bg-yellow-600 text-black rounded-2xl font-marker text-xl uppercase tracking-widest hover:brightness-110 shadow-lg transition-all active:scale-95">
                  {t.confirmDeposit}
                </button>
                <button onClick={() => setShowDepositModal(false)} className="px-6 bg-zinc-800 text-zinc-400 rounded-2xl font-marker text-sm uppercase transition-all">
                  X
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className={`bg-gradient-to-br from-zinc-900 to-black border ${isInGang ? 'border-red-900/40' : 'border-zinc-800 opacity-80'} rounded-2xl p-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.5)]`}>
        <h2 className="text-red-600 font-marker text-2xl mb-6 tracking-widest">{t.laundering}</h2>
        {isInGang ? (
          <div className="relative inline-block mb-6">
            <div className="text-5xl font-black text-yellow-500">{user.unclaimedFarming.toFixed(5)}</div>
            <span className="text-zinc-500 font-bold text-xs uppercase tracking-[0.3em] mt-2 block">{t.tonCollected}</span>
          </div>
        ) : (
          <p className="text-[10px] text-red-900 font-black uppercase mb-6">{t.mustBelongCartel}</p>
        )}
        <button onClick={handleClaim} disabled={!isInGang || user.unclaimedFarming <= 0} className={`w-full py-5 rounded-2xl font-marker text-2xl uppercase transition-all ${isInGang && user.unclaimedFarming > 0 ? 'bg-red-700 hover:bg-red-600 gold-glow' : 'bg-zinc-800 text-zinc-600 opacity-50'}`}>
          {t.claim} 💰
        </button>
      </section>

      <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex items-center gap-5 italic text-zinc-400 text-sm">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-2xl border border-zinc-800">🚬</div>
        <p className="leading-relaxed">"{flavor}"</p>
      </section>
    </div>
  );
};

const StatBox: React.FC<{ label: string, value: string, color: string, icon: string }> = ({ label, value, color, icon }) => (
  <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
    <span className="text-[10px] mb-1">{icon}</span>
    <p className={`text-xl font-black ${color} tracking-tighter`}>{value}</p>
    <p className="text-[7px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">{label}</p>
  </div>
);

export default Dashboard;
