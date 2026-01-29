'use client';

import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { ROULETTE_ITEMS } from '../constants';
import { useGame, useTranslation } from '../context/GameContext';

const Roulette: React.FC = () => {
  const { user, setUser, t } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState<any>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (user.tickets <= 0 || spinning) return;

    setSpinning(true);
    setWin(null);

    // 1. Pick result based on probabilities
    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;
    for (let i = 0; i < ROULETTE_ITEMS.length; i++) {
      cumulative += ROULETTE_ITEMS[i].probability;
      if (rand < cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const selected = ROULETTE_ITEMS[selectedIndex];

    // 2. Calculate rotation
    const segmentAngle = 18; // 360 / 20 segments
    const extraRotations = 7 + Math.floor(Math.random() * 5); // 7 to 12 full spins

    // We want the selected index to end up at the TOP (0 degrees)
    // The index 0 is at 0 degrees. Index 1 is at 18 degrees, etc.
    // To bring index `i` to the top, we rotate by -(i * 18)
    const targetAngle = extraRotations * 360 - (selectedIndex * segmentAngle);

    setRotation(prev => targetAngle + (prev % 360));

    // 3. Award prize after animation
    setTimeout(() => {
      const updatedUser = { ...user, tickets: user.tickets - 1 };

      if (selected.type === 'TON') {
        updatedUser.balance += Number(selected.value);
      }

      if (selected.type === 'BUFF') {
        const key = String(selected.value);
        updatedUser.inventory = { ...updatedUser.inventory, [key]: (updatedUser.inventory?.[key] || 0) + 1 };
      }

      if (selected.type === 'WEAPON') {
        updatedUser.ownedWeapons = [...user.ownedWeapons, selected.value];
      }

      setUser(updatedUser);
      setWin(selected);
      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-marker text-yellow-500 mb-1">{t.roulette}</h2>
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest italic">"Apuéstalo todo, recupera el barrio"</p>
      </div>

      <div className="relative flex flex-col justify-center items-center py-8">
        {/* Indicator (The Pin at the top) */}
        <div className="absolute top-4 z-30 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>

        {/* Wheel Container */}
        <div
          ref={wheelRef}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none'
          }}
          className="w-72 h-72 rounded-full border-8 border-zinc-800 relative overflow-hidden bg-zinc-900 shadow-[0_0_60px_rgba(0,0,0,1)] ring-4 ring-zinc-900/50"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {ROULETTE_ITEMS.map((item, i) => {
              const startAngle = i * 18;
              const endAngle = (i + 1) * 18;
              // Coordinates for the slice
              const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);

              // Color logic
              let color = i % 2 === 0 ? '#1a1a1a' : '#7f1d1d';
              if (item.value >= 0.05) color = '#eaaf08'; // Jackpot color
              if (item.type === 'MISS') color = i % 2 === 0 ? '#000000' : '#450a0a';

              return (
                <g key={i}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                    fill={color}
                    stroke="#000"
                    strokeWidth="0.1"
                  />
                  {/* Text label for each segment */}
                  <text
                    x="50"
                    y="15"
                    transform={`rotate(${startAngle + 9}, 50, 50)`}
                    fill={item.value >= 0.05 ? '#000' : '#fff'}
                    fontSize="2.2"
                    fontWeight="900"
                    textAnchor="middle"
                    className="font-sans tracking-tighter"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {item.label.replace(' TON', '')}
                  </text>
                </g>
              );
            })}

            {/* Edge Lights/Dots */}
            {Array.from({ length: 20 }).map((_, i) => (
              <circle
                key={i}
                cx={50 + 48 * Math.cos((Math.PI * (i * 18 - 90)) / 180)}
                cy={50 + 48 * Math.sin((Math.PI * (i * 18 - 90)) / 180)}
                r="0.8"
                fill={spinning && Math.random() > 0.5 ? '#ffff00' : '#ffffff'}
              />
            ))}
          </svg>

          {/* Inner Decorative Hub */}
          <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border-4 border-zinc-800 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] z-10">
            <img
              src="https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png"
              className="w-10 drop-shadow-lg"
              alt="Logo"
            />
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tus Tickets:</span>
          <span className="text-red-500 font-marker text-xl">{user.tickets}</span>
          <span className="text-lg">🎟️</span>
        </div>

        <button
          onClick={spin}
          disabled={spinning || user.tickets <= 0}
          className={`w-full py-4 rounded-xl font-marker text-xl uppercase tracking-widest transition-all shadow-xl ${user.tickets > 0 && !spinning
            ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:brightness-110 active:scale-95 gold-glow'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
            }`}
        >
          {spinning ? 'GIRANDO...' : `${t.spinFor}`}
        </button>
      </div>

      {win && (
        <div className="bg-zinc-900 border-2 border-yellow-500 p-5 rounded-2xl text-center animate-in fade-in zoom-in duration-300 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-tighter">¡Resultado del Golpe!</p>
          <h4 className={`text-2xl font-marker ${win.type === 'MISS' ? 'text-red-500' : 'text-green-500'}`}>
            {win.label}
          </h4>
          {win.value >= 0.05 && (
            <div className="mt-2 py-1 bg-yellow-500 text-black text-[10px] font-black uppercase rounded animate-pulse">
              ¡JACKPOT DEL BARRIO! 🏆
            </div>
          )}
        </div>
      )}

      {/* Probability Legend */}
      <div className="bg-black/40 p-3 rounded-lg border border-zinc-800/50">
        <p className="text-[9px] text-zinc-600 uppercase font-bold mb-2 text-center">Tabla de Premios Disponibles</p>
        <div className="grid grid-cols-5 gap-1">
          {Array.from(new Set(ROULETTE_ITEMS.map(i => i.label))).slice(0, 10).map((label, idx) => (
            <div key={idx} className="bg-zinc-900/50 p-1 text-[7px] text-center border border-zinc-800 rounded text-zinc-400 font-medium">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roulette;