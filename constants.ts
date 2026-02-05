
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
  { id: '4', label: 'Suministros', value: 'oil', type: 'BUFF', probability: 0.20 }, // Replaces Ammo with Oil
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

// --- EMPIRE UPDATE CONSTANTS ---

export const EMPIRE_CONSTANTS = {
  MAX_ENERGY: 10,
  ENERGY_REFILL_MS: 8640000, // 2.4 Hours (144 min)
  SHOCK_DURATION_MS: 21600000, // 6 Hours
  RENEW_MISSIONS_COST: 0.1, // TON
};

// EDIFICIOS (Solo datos estáticos de niveles)
export const BUILDINGS_DATA = {
  vices: {
    id: 'vices',
    name: 'Red de Vicios',
    type: 'VICE',
    levels: [
      { level: 1, name: 'Punto de Esquina', cost: 1000, slots: 1, image: '/assets/empire/vices_1.png' },
      { level: 2, name: 'Casa de Citas', cost: 5000, slots: 2, image: '/assets/empire/vices_2.png' },
      { level: 3, name: 'Club Privado', cost: 20000, slots: 3, image: '/assets/empire/vices_3.png' },
      { level: 4, name: 'Agencia de Modelos', cost: 100000, slots: 4, image: '/assets/empire/vices_4.png' },
      { level: 5, name: 'Casino Royale', cost: 500000, slots: 5, image: '/assets/empire/vices_5.png' }
    ]
  },
  chems: {
    id: 'chems',
    name: 'Laboratorios',
    type: 'CHEM',
    levels: [
      { level: 1, name: 'Dealer de Barrio', cost: 1000, slots: 1, image: '/assets/empire/chems_1.png' },
      { level: 2, name: 'Cocina Casera', cost: 5000, slots: 2, image: '/assets/empire/chems_2.png' },
      { level: 3, name: 'Laboratorio Móvil', cost: 20000, slots: 3, image: '/assets/empire/chems_3.png' },
      { level: 4, name: 'Centro de Distribución', cost: 100000, slots: 4, image: '/assets/empire/chems_4.png' },
      { level: 5, name: 'Superlaboratorio', cost: 500000, slots: 5, image: '/assets/empire/chems_5.png' }
    ]
  }
};

// CATALOGO DE PERSONAL// 5. STAFF CATLOG
export const STAFF_CATALOG = [
  // VICIOS (CWARS)
  { id: 'novice', name: 'La Novata', type: 'VICE', cost: 300, durationHours: 24, productionRate: 20, productionType: 'CWARS', rarity: 'COMMON', description: 'A basic street dealer.' },
  { id: 'dancer', name: 'Bailarina Exótica', type: 'VICE', cost: 1500, durationHours: 24, productionRate: 100, productionType: 'CWARS', rarity: 'RARE', description: 'Attracts high-paying clients.' },
  { id: 'scort', name: 'Scort VIP', type: 'VICE', cost: 5000, durationHours: 48, productionRate: 350, productionType: 'CWARS', rarity: 'EPIC', description: 'Provides exclusive services.' },
  { id: 'influencer', name: 'Influencer', type: 'VICE', cost: 25000, durationHours: 24, productionRate: 1500, productionType: 'CWARS', rarity: 'LEGENDARY', description: 'Leverages social media reach.' },
  { id: 'madame', name: 'La Madame', type: 'VICE', cost: 50000, durationHours: 168, productionRate: 400, productionType: 'CWARS', rarity: 'EPIC', description: 'Manages a network of escorts.' },

  // QUIMICOS (POLVO)
  { id: 'dealer', name: 'Jíbaro', type: 'CHEM', cost: 400, durationHours: 24, productionRate: 2, productionType: 'POLVO', rarity: 'COMMON', description: 'Street level distributor.' },
  { id: 'cook', name: 'Cocinero', type: 'CHEM', cost: 2000, durationHours: 24, productionRate: 12, productionType: 'POLVO', rarity: 'RARE', description: 'Knows the basic recipe.' },
  { id: 'chemist', name: 'Químico', type: 'CHEM', cost: 8000, durationHours: 48, productionRate: 40, productionType: 'POLVO', rarity: 'EPIC', description: 'Professional grade production.' },
  { id: 'transporter', name: 'Transportista', type: 'CHEM', cost: 20000, durationHours: 24, productionRate: 200, productionType: 'POLVO', rarity: 'EPIC', description: 'Moves product across borders.' },
  { id: 'heisenberg', name: 'Heisenberg', type: 'CHEM', cost: 100000, durationHours: 48, productionRate: 1000, productionType: 'POLVO', rarity: 'LEGENDARY', description: 'The one who knocks.' },
];

// MISIONES (POOL DE 10)
export const MISSIONS_POOL = [
  // TIER 1: CALLE (70% Win)
  {
    id: 'm_visit',
    title: 'Cobro de Piso',
    description: 'La pizzería de Tony no pagó la protección.',
    tier: 'STREET',
    costEnergy: 2,
    costCwars: 20,
    successRate: 0.7,
    rewards: { cwars: 50, reputation: 10 },
    penalty: { cwars: 20, energy: 0, shock: false, text: 'Tony llamó a la policía antes de que entraras.' }
  },
  {
    id: 'm_delivery',
    title: 'Entrega Rápida',
    description: 'Lleva el paquete al punto B en moto sin preguntas.',
    tier: 'STREET',
    costEnergy: 2,
    costCwars: 20,
    successRate: 0.7,
    rewards: { cwars: 60, reputation: 10 },
    penalty: { cwars: 20, energy: 0, shock: false, text: 'Te caíste de la moto y perdiste la carga.' }
  },
  {
    id: 'm_spy',
    title: 'Vigilancia',
    description: 'Sigue a la esposa del Concejal y toma fotos.',
    tier: 'STREET',
    costEnergy: 2,
    costCwars: 20,
    successRate: 0.7,
    rewards: { cwars: 50, reputation: 10 },
    penalty: { cwars: 20, energy: -2, shock: false, text: 'Te descubrieron los guardaespaldas y te dieron una paliza.' }
  },

  // TIER 2: PRO (60% Win)
  {
    id: 'm_route66',
    title: 'Ruta 66',
    description: 'Cruza la frontera estatal con el camión cargado.',
    tier: 'PRO',
    costEnergy: 3,
    costCwars: 150,
    successRate: 0.6,
    rewards: { cwars: 350, reputation: 35 },
    penalty: { cwars: 150, energy: -1, shock: false, text: 'Control de aduanas sorpresa. Incautaron todo.' }
  },
  {
    id: 'm_arson',
    title: 'Quema de Inventario',
    description: 'El rival abrió un almacén nuevo. Hazlo cenizas.',
    tier: 'PRO',
    costEnergy: 3,
    costCwars: 150,
    successRate: 0.6,
    rewards: { cwars: 400, reputation: 35 },
    penalty: { cwars: 150, energy: -1, shock: false, text: 'Quedaste atrapado en el fuego al huir.' }
  },
  {
    id: 'm_bribe',
    title: 'Soborno Judicial',
    description: 'Compra al fiscal principal antes del juicio del lunes.',
    tier: 'PRO',
    costEnergy: 3,
    costCwars: 150,
    successRate: 0.6,
    rewards: { cwars: 450, reputation: 35 },
    penalty: { cwars: 150, energy: -1, shock: false, text: 'El fiscal grabó la conversación. Tuviste que huir.' }
  },

  // TIER 3: CARTEL (60% Win, Alto Riesgo SHOCK)
  {
    id: 'm_train',
    title: 'Asalto al Tren Blindado',
    description: 'Vuela las vías y roba la carga de oro del gobierno.',
    tier: 'CARTEL',
    costEnergy: 4,
    costCwars: 500,
    successRate: 0.6,
    rewards: { cwars: 1500, reputation: 100 },
    penalty: { cwars: 500, energy: -10, shock: true, text: 'Emboscada militar. Estás gravemente herido.' }
  },
  {
    id: 'm_kidnap',
    title: 'Secuestro Express',
    description: 'Tomamos al hijo del banquero central. Rápido y limpio.',
    tier: 'CARTEL',
    costEnergy: 4,
    costCwars: 500,
    successRate: 0.6,
    rewards: { cwars: 1800, reputation: 120 },
    penalty: { cwars: 500, energy: -10, shock: true, text: 'Era una trampa con señuelo. Casi no sales vivo.' }
  },
  {
    id: 'm_coup',
    title: 'Golpe de Estado',
    description: 'Asalto frontal a la mansión del Cartel Rival. Todo o nada.',
    tier: 'CARTEL',
    costEnergy: 4,
    costCwars: 500,
    successRate: 0.6,
    rewards: { cwars: 2500, reputation: 200 },
    penalty: { cwars: 500, energy: -10, shock: true, text: 'Te superaron en número. Batalla perdida y humillante.' }
  },
  {
    id: 'm_sub',
    title: 'Narcosubmarino',
    description: 'Pilota el sumergible con 4 toneladas hasta la costa.',
    tier: 'CARTEL',
    costEnergy: 4,
    costCwars: 500,
    successRate: 0.6,
    rewards: { cwars: 3000, reputation: 250 },
    penalty: { cwars: 500, energy: -10, shock: true, text: 'Fallo de motor. El submarino se hundió contido dentro.' }
  }
];




