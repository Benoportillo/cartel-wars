'use client';

import React, { useState } from 'react';
import { useTranslation } from '../context/GameContext';

interface Props {
  onFinish: () => void;
}

const GameGuide: React.FC<Props> = ({ onFinish }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const guideSteps = [
    {
      title: t.guideWelcome,
      text: t.guideWelcomeText,
      icon: "🏙️",
      accent: "from-red-600 to-red-900"
    },
    {
      title: t.guideEconomy,
      text: t.guideEconomyText,
      icon: "💰",
      accent: "from-yellow-600 to-yellow-900"
    },
    {
      title: t.guideArsenal,
      text: t.guideArsenalText,
      icon: "⚔️",
      accent: "from-blue-600 to-blue-900"
    },
    {
      title: t.guideWarfare,
      text: t.guideWarfareText,
      icon: "💀",
      accent: "from-zinc-600 to-zinc-900"
    },

  ];

  const currentStep = guideSteps[step];

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-b ${currentStep.accent} opacity-10 transition-colors duration-1000`}></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20"></div>

      <div className="relative z-10 w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <h1 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">{t.guideTitle}</h1>
          <div className="h-[2px] w-20 bg-red-600 mx-auto"></div>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${currentStep.accent} opacity-50`}></div>

          <div className="text-7xl mb-8 transform transition-transform group-hover:scale-110 duration-500 inline-block drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {currentStep.icon}
          </div>

          <h2 className="text-2xl font-marker text-white mb-4 uppercase tracking-wider italic">
            {currentStep.title}
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            {currentStep.text}
          </p>

          <div className="mt-8 flex justify-center gap-2">
            {guideSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-red-600' : 'w-2 bg-zinc-800'}`}
              ></div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-zinc-800 hover:text-white transition-all"
            >
              {t.prev}
            </button>
          )}

          {step < guideSteps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-[2] py-4 bg-red-700 text-white rounded-2xl font-marker text-lg uppercase tracking-widest shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:bg-red-600 active:scale-95 transition-all"
            >
              {t.next}
            </button>
          ) : (
            <button
              onClick={onFinish}
              className="flex-[2] py-4 bg-yellow-600 text-black rounded-2xl font-marker text-lg uppercase tracking-widest shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:bg-yellow-500 active:scale-95 transition-all animate-pulse"
            >
              {t.guideFinish}
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 text-[8px] text-zinc-800 font-black uppercase tracking-[0.5em] pointer-events-none">
        Protocolo de Inducción de Campo v1.0
      </div>
    </div>
  );
};

export default GameGuide;
