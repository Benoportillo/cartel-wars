
import { Rank } from './types.js';
import type { Weapon, RouletteResult } from './types.js';

export const WEAPONS: Weapon[] = [
  {
    id: 'starter',
    name: 'Navaja de Mariposa',
    category: 'Cuerpo a Cuerpo',
    level: 1,
    price: 0,
    protectionRate: 10, // ROI: Infinito (Gratis)

    firepower: 0.35,
    miningPower: 1, // 24/day
    statusBonus: 5,
    image: 'https://i.ibb.co/GQr1W2vH/1000521621-removebg-preview.png',
    description: 'Para encuentros cercanos. Silenciosa y mortal.',
    skinImages: {}
  },
  {
    id: 'glock',
    name: 'Glock 17',
    category: 'Pistola',
    level: 1,
    price: 1.5,
    protectionRate: 64, // ROI: 40 Days

    firepower: 0.45,
    miningPower: 4, // 96/day
    statusBonus: 12,
    image: 'https://i.ibb.co/cc8ykq1G/Gemini-Generated-Image-704fwm704fwm704f-removebg-preview.png',
    description: 'El estandar de la calle. Fiable y compacta.'
  },
  {
    id: 'revolver',
    name: 'Python .357 Magnum',
    category: 'Revolver',
    level: 1,
    price: 2.0,
    protectionRate: 72, // ROI: 36 Days

    firepower: 0.52,
    miningPower: 6, // 144/day
    statusBonus: 25,
    image: 'https://i.ibb.co/XZxm3H2M/Gemini-Generated-Image-ei522vei522vei52-removebg-preview.png',
    description: 'Poder puro en un tambor de acero.'
  },
  {
    id: 'mp5',
    name: 'MP5 Subfusil',
    category: 'Subfusil',
    level: 2,
    price: 6.5,
    protectionRate: 81, // ROI: 32 Days

    firepower: 0.58,
    miningPower: 22, // 528/day
    statusBonus: 80,
    image: 'https://i.ibb.co/Zpr95hr2/Gemini-Generated-Image-frz2wzfrz2wzfrz2-removebg-preview.png',
    description: 'Cadencia infernal para control de multitudes.'
  },
  {
    id: 'ak47',
    name: 'AK-47 Chapada en Oro',
    category: 'Fusil',
    level: 3,
    price: 15.0,
    protectionRate: 91, // ROI: 28 Days

    firepower: 0.72,
    miningPower: 57, // 1368/day
    statusBonus: 250,
    image: 'https://i.ibb.co/W7CVQDy/Gemini-Generated-Image-x8tndox8tndox8tn-removebg-preview.png',
    description: 'El simbolo del poder absoluto en el cartel.'
  },
  {
    id: 'barrett',
    name: 'Barrett .50 Sniper',
    category: 'Francotirador',
    level: 4,
    price: 35.0,
    protectionRate: 102, // ROI: 25 Days

    firepower: 0.85,
    miningPower: 150, // 3600/day
    statusBonus: 400,
    image: 'https://i.ibb.co/ZRHxGykr/Gemini-Generated-Image-n39pmdn39pmdn39p-removebg-preview.png',
    description: 'Si lo ves, ya es demasiado tarde.'
  },
  {
    id: 'm249',
    name: 'Ametralladora M249',
    category: 'Pesada',
    level: 4,
    price: 50.0,
    protectionRate: 111, // ROI: 23 Days

    firepower: 0.92,
    miningPower: 232, // 5568/day
    statusBonus: 600,
    image: 'https://i.ibb.co/1YhPCYsT/Gemini-Generated-Image-ajl2viajl2viajl2-removebg-preview.png',
    description: 'Lluvia de plomo para los que no pagan la cuota.'
  },
  {
    id: 'bazooka',
    name: 'Lanzacohetes RPG-7',
    category: 'Especial',
    level: 4,
    price: 80.0,
    protectionRate: 128, // ROI: 20 Days (Efficient)

    firepower: 0.98,
    miningPower: 427, // 10248/day
    statusBonus: 1000,
    isLimited: true,
    image: 'https://i.ibb.co/bRWKpw8B/Gemini-Generated-Image-futp7nfutp7nfutp-removebg-preview.png',
    description: 'Solución definitiva para problemas blindados.'
  }
];

export const ROULETTE_ITEMS: RouletteResult[] = [
  { id: '0', label: '10 TON', value: 10, type: 'TON', probability: 0.002 }, // 0.2% Jackpot
  { id: '1', label: '1 TON', value: 1, type: 'TON', probability: 0.02 }, // 2% Big Win
  { id: '2', label: '0.2 TON', value: 0.2, type: 'TON', probability: 0.15 }, // 15% Win
  { id: '3', label: 'Aceite', value: 'oil', type: 'BUFF', probability: 0.20 }, // 20% Consolation
  { id: '4', label: 'Munición', value: 'ammo', type: 'BUFF', probability: 0.20 }, // 20% Consolation (Visual only for now, or mapped to something)
  { id: '5', label: 'Nada', value: 0, type: 'MISS', probability: 0.428 }, // 42.8% Loss
];

export const INITIAL_USER: any = {
  id: '',
  telegramId: '',
  email: '',
  name: 'Gatillero_7',
  nameChanged: false,
  rank: Rank.INDEPENDIENTE,
  balance: 0.2,
  cwarsBalance: 0,
  tonWithdrawn: 0.0,
  tickets: 1,
  referrals: 0,
  lastRaceDate: null,
  ownedWeapons: [{ weaponId: 'starter', caliberLevel: 1, magazineLevel: 1, accessoryLevel: 1, skin: '#333333' }],
  lastTicketDate: new Date(),

  status: 5,
  inventory: {},

  isBanned: false,
  isAdmin: false,
  hasSeenGuide: false,
  totalReferralBonus: 0,
  language: 'en'
};

export const SHOP_ITEMS = [
  { id: 'oil', name: 'Aceite de Arma', price: 0.5, image: '/assets/items/oil.png', description: 'Evita que el arma se trabe en combate.', type: 'BUFF' },
  { id: 'charm', name: 'Amuleto de la Muerte', price: 1.2, image: '/assets/items/charm.png', description: 'Aumenta probabilidad de golpe crítico.', type: 'BUFF' },
  { id: 'kevlar', name: 'Chaleco Kevlar', price: 2.0, image: '/assets/items/kevlar.png', description: 'Reduce drásticamente las pérdidas al morir.', type: 'BUFF' }
];

export const MASTER_WALLET_ADDRESS = "UQDZDP9qAdglpsThm7XFhSGKjFhx98nJj6IzGI0yh-rop7H7";
export const WITHDRAWAL_WALLET_ADDRESS = "UQD-h3pdcJlGjyWqG9d7QZszZqjMz9IxRqdkSjaVOzqC5O01";


