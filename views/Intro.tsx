
import React, { useEffect, useState, useRef } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props {
  onEnter: (lang: Language) => void;
}

const Intro: React.FC<Props> = ({ onEnter }) => {
  const [langStep, setLangStep] = useState(true);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [step, setStep] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const narrative = {
    es: [
      "En estas calles, el plomo dicta la ley.",
      "La lealtad tiene un precio... la traición sale cara.",
      "El CWARS es la única moneda que importa aquí.",
      "Bienvenido al infierno. ¿Plata o Plomo?"
    ],
    en: [
      "In these streets, lead writes the law.",
      "Loyalty has a price... betrayal costs everything.",
      "CWARS is the only currency that matters here.",
      "Welcome to hell. Silver or Lead?"
    ],
    ru: [
      "На этих улицах свинец диктует законы.",
      "У верности есть цена... предательство стоит жизни.",
      "CWARS — единственная валюта, которая имеет значение.",
      "Добро пожаловать в ад. Серебро или свинец?"
    ],
    ar: [
      "في هذه الشوارع، الرصاص هو القانون.",
      "للولاء ثمن... والخيانة تكلف كل شيء.",
      "CWARS هي العملة الوحيدة التي تهم هنا.",
      "أهلاً بك في الجحيم. الفضة أو الرصاص؟"
    ]
  };

  const handleLanguageSelect = (lang: Language) => {
    setIsFading(true);
    setTimeout(() => {
      setSelectedLang(lang);
      setLangStep(false);
      setIsFading(false);
    }, 800);
  };

  useEffect(() => {
    if (!langStep && selectedLang && step < narrative[selectedLang].length) {
      let i = 0;
      const fullText = narrative[selectedLang][step];
      setDisplayText("");
      
      const interval = setInterval(() => {
        setDisplayText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
          setTimeout(() => {
            if (step < narrative[selectedLang].length - 1) {
              setStep(s => s + 1);
            } else {
              setShowButton(true);
            }
          }, 2200);
        }
      }, 60);

      return () => clearInterval(interval);
    }
  }, [langStep, selectedLang, step]);

  const isFinalScene = step === (selectedLang ? narrative[selectedLang].length - 1 : 0);
  
  // SOLUCIÓN AL CRASH: Asegurar que 't' siempre tenga un valor válido
  const t = selectedLang ? (translations[selectedLang] || translations.en) : translations.en;

  // Function to render styled narrative text
  const renderStyledText = (text: string) => {
    if (!selectedLang) return text;

    // Special words to highlight per language
    const getWords = (l: Language) => {
      switch(l) {
        case 'es': return { silver: 'Plata', or: 'o', lead: 'Plomo' };
        case 'ru': return { silver: 'Серебро', or: 'или', lead: 'свинец' };
        case 'ar': return { silver: 'الفضة', or: 'أو', lead: 'الرصاص' };
        default: return { silver: 'Silver', or: 'or', lead: 'Lead' };
      }
    };

    const { silver: silverWord, or: orWord, lead: leadWord } = getWords(selectedLang);
    const cwarsWord = 'CWARS';

    const regex = new RegExp(`(${silverWord}|${orWord}|${leadWord}|${cwarsWord})`, 'g');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part === cwarsWord) {
        return <span key={index} className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">{part}</span>;
      }
      
      if (isFinalScene) {
        if (part === silverWord || part === leadWord) {
          return <span key={index} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{part}</span>;
        }
        if (part === orWord) {
          return <span key={index} className="text-red-600">{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (langStep) {
    return (
      <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-all duration-1000 ${isFading ? 'opacity-0 scale-110 blur-xl' : 'opacity-100 scale-100'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-16 w-full max-w-md px-10">
           <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20 animate-pulse"></div>
              <img 
                src="https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png" 
                alt="Logo" 
                className="w-56 drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]"
              />
           </div>
            
            <div className="space-y-6 w-full">
              <div className="flex flex-col items-center gap-2 mb-8">
                <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.4em] text-center">SELECCIONA TU IDIOMA</p>
                <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'es', label: 'Español' },
                  { id: 'ru', label: 'Русский' },
                  { id: 'ar', label: 'العربية' }
                ].map((l) => (
                  <button 
                    key={l.id}
                    onClick={() => handleLanguageSelect(l.id as Language)}
                    className="group relative py-5 bg-zinc-950/80 border border-zinc-800/50 hover:border-red-600 transition-all rounded-sm overflow-hidden shadow-2xl"
                  >
                    <span className="relative z-10 font-bold uppercase tracking-[0.2em] text-zinc-400 group-hover:text-red-500 transition-colors">
                      {l.label}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-500"></div>
                  </button>
                ))}
              </div>
            </div>
        </div>
      </div>
    );
  }

  const isRtl = selectedLang === 'ar';

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Skip button */}
      <button 
        onClick={() => selectedLang && onEnter(selectedLang)}
        className="absolute top-8 right-8 z-[110] px-4 py-2 border border-zinc-800 bg-black/50 text-[10px] text-zinc-500 uppercase font-black tracking-widest hover:text-white hover:border-white transition-all rounded"
      >
        {t.skipIntro} ➔
      </button>

      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.08)_0%,_transparent_60%)] animate-[pulse_10s_infinite]"></div>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_300px_rgba(0,0,0,1)]"></div>

      {/* Narrative Text */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-10 pointer-events-none">
        <div className={`max-w-4xl w-full text-center transition-all duration-1000 ${showButton ? 'scale-90 opacity-30 blur-sm -translate-y-20' : 'scale-100 opacity-100'}`}>
          <p 
            className={`font-marker text-3xl md:text-6xl tracking-tight italic transition-all duration-1000 leading-tight ${isFinalScene ? 'text-zinc-200' : 'text-zinc-200'} ${isRtl ? 'font-sans font-black' : ''}`} 
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {renderStyledText(displayText)}
            {!showButton && (
              <span className={`inline-block w-[3px] h-10 md:h-16 bg-red-600 animate-flicker shadow-[0_0_15px_rgba(220,38,38,1)] ${isRtl ? 'mr-4' : 'ml-4'}`}></span>
            )}
          </p>
        </div>
      </div>

      {/* UI Overlay: Logo and Button */}
      <div className="relative z-30 w-full h-full flex flex-col items-center justify-between py-12 px-8">
        
        {/* Top Logo */}
        <div className={`transition-all duration-[2000ms] transform ${isFinalScene || showButton ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
          <img 
            src="https://i.ibb.co/JFB1dy5G/logo-cartel-wars-removebg-preview.png" 
            alt="Cartel Wars Logo" 
            className="w-48 md:w-64 h-auto drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] filter grayscale-[0.3]"
          />
        </div>

        {/* Bottom Button Section */}
        <div className={`flex flex-col items-center gap-10 transition-all duration-1000 transform ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <button 
            onClick={() => selectedLang && onEnter(selectedLang)}
            className="group relative px-24 py-6 overflow-hidden rounded-sm border-x border-red-900/30 bg-zinc-950 transition-all hover:border-red-600 hover:scale-105 active:scale-95 shadow-[0_30px_60px_rgba(0,0,0,1)]"
          >
            <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            
            <span className={`relative z-10 font-marker text-2xl md:text-4xl text-zinc-400 group-hover:text-red-600 transition-all tracking-[0.3em] uppercase ${isRtl ? 'font-sans font-black' : ''}`}>
              {selectedLang === 'ar' ? 'ابدأ الحرب' : (selectedLang === 'es' ? 'INICIAR GUERRA' : (selectedLang === 'ru' ? 'ВСТУПИТЬ В БОЙ' : 'ENTER THE WAR'))}
            </span>
          </button>
          
          <div className="flex flex-col items-center gap-4">
            <p className={`text-[11px] uppercase font-black tracking-[0.5em] animate-pulse ${isRtl ? 'font-sans' : ''}`}>
              <span className="text-white">{selectedLang === 'es' ? 'PLATA' : (selectedLang === 'ru' ? 'СЕРЕБРО' : (selectedLang === 'ar' ? 'الفضة' : 'SILVER'))}</span> 
              <span className="text-red-600 mx-2">{selectedLang === 'es' ? 'O' : (selectedLang === 'ru' ? 'ИЛИ' : (selectedLang === 'ar' ? 'أو' : 'OR'))}</span> 
              <span className="text-white">{selectedLang === 'es' ? 'PLOMO' : (selectedLang === 'ru' ? 'СВИНЕЦ' : (selectedLang === 'ar' ? 'الرصاص' : 'LEAD'))}</span>
            </p>
            <div className="flex gap-2">
               <div className="w-1 h-1 bg-red-900 rounded-full"></div>
               <div className="w-1 h-1 bg-red-900 rounded-full opacity-50"></div>
               <div className="w-1 h-1 bg-red-900 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-red-900/20 m-4 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-red-900/20 m-4 pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none border-[30px] border-black blur-xl opacity-90"></div>
    </div>
  );
};

export default Intro;
