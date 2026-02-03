
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
    protectionRate: 125, // ROI: 31 Days

    firepower: 0.45,
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
    protectionRate: 180, // ROI: 27 Days

    firepower: 0.52,
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
    protectionRate: 650, // ROI: 27 Days

    firepower: 0.58,
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
    protectionRate: 1600, // ROI: 26 Days

    firepower: 0.72,
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
    protectionRate: 4000, // ROI: ~21 Days

    firepower: 0.85,
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
    protectionRate: 6000, // ROI: ~20 Days

    firepower: 0.92,
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
    protectionRate: 11000, // ROI: 20 Days (Best Yield)

    firepower: 0.98,
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
  lastClaimDate: new Date(),
  lastTicketDate: new Date(),

  basePower: 0,
  baseStatus: 0,

  firepower: 0,
  status: 5,
  pvpHistory: [],
  language: 'en'
};

export const TERRAINS = [
  { id: 1, name: 'Callejón Oscuro', image: '/assets/terrains/alley.png', favoredWeapon: 'starter', description: 'Combate cerrado y sucio.' },
  { id: 2, name: 'Estacionamiento', image: '/assets/terrains/parking.png', favoredWeapon: 'glock', description: 'Cobertura media entre autos.' },
  { id: 3, name: 'Bar Clandestino', image: '/assets/terrains/bar.png', favoredWeapon: 'revolver', description: 'Espacios reducidos, alto impacto.' },
  { id: 4, name: 'Metro Abandonado', image: '/assets/terrains/metro.png', favoredWeapon: 'mp5', description: 'Pasillos largos, fuego rápido.' },
  { id: 5, name: 'Selva (Guerrilla)', image: '/assets/terrains/jungle.png', favoredWeapon: 'ak47', description: 'Terreno difícil, resistencia.' },
  { id: 6, name: 'Azotea (Sniper)', image: '/assets/terrains/rooftop.png', favoredWeapon: 'barrett', description: 'Visión perfecta de larga distancia.' },
  { id: 7, name: 'Puente Bloqueado', image: '/assets/terrains/bridge.png', favoredWeapon: 'm249', description: 'Fuego de supresión masivo.' },
  { id: 8, name: 'Zona de Guerra', image: '/assets/terrains/warzone.png', favoredWeapon: 'bazooka', description: 'Destrucción de estructuras.' },
  { id: 9, name: 'Autopista', image: '/assets/terrains/highway.png', favoredWeapon: ['barrett', 'bazooka'], description: 'Larga distancia + Vehículos.' },
  { id: 10, name: 'Fortaleza', image: '/assets/terrains/fortress.png', favoredWeapon: ['m249', 'bazooka'], description: 'Asalto pesado a base enemiga.' }
];

export const SHOP_ITEMS = [
  { id: 'oil', name: 'Aceite de Arma', price: 0.5, image: '/assets/items/oil.png', description: 'Evita que el arma se trabe en combate.', type: 'BUFF' },
  { id: 'charm', name: 'Amuleto de la Muerte', price: 1.2, image: '/assets/items/charm.png', description: 'Aumenta probabilidad de golpe crítico.', type: 'BUFF' },
  { id: 'kevlar', name: 'Chaleco Kevlar', price: 2.0, image: '/assets/items/kevlar.png', description: 'Reduce drásticamente las pérdidas al morir.', type: 'BUFF' }
];

export const MASTER_WALLET_ADDRESS = "UQDZDP9qAdglpsThm7XFhSGKjFhx98nJj6IzGI0yh-rop7H7";
export const WITHDRAWAL_WALLET_ADDRESS = "UQD-h3pdcJlGjyWqG9d7QZszZqjMz9IxRqdkSjaVOzqC5O01";
