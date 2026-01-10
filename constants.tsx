
import { Weapon, Rank, RouletteResult } from './types';

export const WEAPONS: Weapon[] = [
  {
    id: 'starter',
    name: 'Navaja de Mariposa',
    category: 'Cuerpo a Cuerpo',
    level: 1,
    price: 0,
    protectionRate: 0.001,
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
    protectionRate: 0.0025,
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
    protectionRate: 0.005,
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
    protectionRate: 0.015,
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
    protectionRate: 0.045,
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
    protectionRate: 0.095,
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
    protectionRate: 0.15,
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
    protectionRate: 0.25,
    firepower: 0.98,
    statusBonus: 1000,
    isLimited: true,
    image: 'https://i.ibb.co/bRWKpw8B/Gemini-Generated-Image-futp7nfutp7nfutp-removebg-preview.png',
    description: 'Solución definitiva para problemas blindados.'
  }
];

export const ROULETTE_ITEMS: RouletteResult[] = [
  { id: '0', label: '0.001 TON', value: 0.001, type: 'TON', probability: 0.15 },
  { id: '1', label: '0.002 TON', value: 0.002, type: 'TON', probability: 0.10 },
  { id: '2', label: '0.001 TON', value: 0.001, type: 'TON', probability: 0.10 },
  { id: '3', label: 'Cárcel', value: 0, type: 'MISS', probability: 0.08 },
  { id: '4', label: '0.005 TON', value: 0.005, type: 'TON', probability: 0.07 },
  { id: '5', label: '0.01 TON', value: 0.01, type: 'TON', probability: 0.05 },
  { id: '6', label: '0.001 TON', value: 0.001, type: 'TON', probability: 0.10 },
  { id: '7', label: '0.002 TON', value: 0.002, type: 'TON', probability: 0.05 },
  { id: '8', label: 'JACKPOT 0.1', value: 0.1, type: 'TON', probability: 0.0001 },
  { id: '9', label: '0.001 TON', value: 0.001, type: 'TON', probability: 0.05 },
  { id: '10', label: '0.02 TON', value: 0.02, type: 'TON', probability: 0.03 },
  { id: '11', label: '0.001 TON', value: 0.001, type: 'TON', probability: 0.05 },
  { id: '12', label: 'Multa', value: 0, type: 'MISS', probability: 0.04 },
  { id: '13', label: '0.005 TON', value: 0.005, type: 'TON', probability: 0.04 },
  { id: '14', label: '0.05 TON', value: 0.05, type: 'TON', probability: 0.005 },
  { id: '15', label: '0.001 TON', value: 0.001, type: 'TON', probability: 0.03 },
  { id: '16', label: 'Cárcel', value: 0, type: 'MISS', probability: 0.02 },
  { id: '17', label: '0.002 TON', value: 0.002, type: 'TON', probability: 0.02 },
  { id: '18', label: '0.01 TON', value: 0.01, type: 'TON', probability: 0.01 },
  { id: '19', label: '0.001 TON', value: 0.001, type: 'TON', probability: 0.0049 },
];

export const INITIAL_USER: any = {
  id: '',
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
  unclaimedFarming: 0,
  basePower: 0, // Ajustado a 0 para que el total inicial sea solo el del arma (35)
  baseStatus: 0,  
  power: 35, // Representación visual inicial
  status: 5,
  pvpHistory: [],
  language: 'en'
};
