
export const Rank = {
  INDEPENDIENTE: 'Independiente',
  RECLUTA: 'Recluta del Cartel',
  SOLDADO: 'Soldado',
  SICARIO: 'Sicario',
  TENIENTE: 'Teniente',
  JEFE: 'Jefe de Cartel'
} as const;

export type Rank = typeof Rank[keyof typeof Rank];

export type Language = 'es' | 'en' | 'ru' | 'ar';

export interface Weapon {
  id: string;
  name: string;
  category: string;
  level: number;
  price: number;
  protectionRate: number;

  firepower: number;
  miningPower: number;
  statusBonus: number;
  isLimited?: boolean;
  image: string;
  description: string;
  skinImages?: Record<string, string>;
}

export interface WeaponInstance {
  weaponId: string;
  caliberLevel: number;
  magazineLevel: number;
  accessoryLevel: number;
  skin: string;
  // Persisted Stats (Denormalization)
  name?: string;
  image?: string;
  firepower?: number;
  miningPower?: number;
  statusBonus?: number;
}







export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: 'TON' | 'CWARS';
  txid: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}



export interface GlobalSettings {
  swapEnabled: boolean;
  withdrawalEnabled: boolean;
  maintenanceMode: boolean;

  referralCommissionPercent: number; // Nuevo: Porcentaje configurable
  gangsterHours?: { start: number; end: number; bonus: number }[]; // 0-23 hours
  lastGangsterUpdate?: number; // Timestamp of last randomization
}

export interface UserProfile {
  id: string;
  telegramId?: string;
  email: string;
  password?: string;
  name: string;
  nameChanged: boolean;
  rank: Rank;
  balance: number;
  cwarsBalance: number;
  tonWithdrawn: number;
  tickets: number;
  referrals: number;
  referredBy?: string; // ID of the user who recruited this hitman
  lastRaceDate: Date | null;
  ownedWeapons: WeaponInstance[];
  lastTicketDate: Date;
  lastEarningsUpdate?: Date; // For mining sync tracking

  language: Language;

  status: number; // Total Displayed Respect
  inventory: Record<string, number>; // New: Buffs & Consumables

  myGangId?: string;
  joinedGangId?: string;
  appliedGangId?: string;
  pendingFeeLock?: number;

  isBanned?: boolean;
  isAdmin?: boolean;
  hasSeenGuide?: boolean;
  totalReferralBonus?: number; // New: Tracks CWARS earned from referrals

  // EMPIRE UPDATE
  reputation: number;
  energy: number;
  maxEnergy: number;
  lastEnergyUpdate: Date;
  shockUntil?: Date; // If present and future, user is in SHOCK (paralyzed)
  buildings: Record<string, number>; // Building ID -> Level
  staff: ActiveStaff[]; // Active employees
}

export interface ActiveStaff {
  instanceId: string;
  staffId: string; // Ref to constant
  buildingId: string; // Where are they assigned?
  slotIndex: number;
  expiresAt: Date;
}

export interface EmpireBuilding {
  id: string;
  name: string;
  type: 'VICE' | 'CHEM';
  levels: {
    level: number;
    cost: number;
    slots: number;
    image: string;
  }[];
}

export interface StaffTemplate {
  id: string;
  name: string;
  type: 'VICE' | 'CHEM';
  cost: number; // CWARS
  durationHours: number;
  productionRate: number; // Amount per hour
  productionType: 'CWARS' | 'POLVO';
  image: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  tier: 'STREET' | 'PRO' | 'CARTEL';
  costEnergy: number;
  costCwars: number;
  successRate: number; // 0-1
  rewards: {
    cwars: number;
    reputation: number;
  };
  penalty: {
    cwars: number;
    energy: number;
    shock: boolean; // 6h paralysis
    text: string;
  };
}

export interface RouletteResult {
  id: string;
  label: string;
  value: any;
  type: 'TON' | 'BOOST' | 'PIECE' | 'WEAPON' | 'MISS' | 'CWARS' | 'BUFF';
  probability: number;
}
