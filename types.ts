
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
  miningPower: number; // New: Decoupled Economy Stat
  firepower: number;
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
}

export interface GangMember {
  name: string;
  rank: Rank;
  joinedAt: Date;
  paidFee: number;
  warPowerContribution?: number;
}

export interface CartelWar {
  id: string;
  attackerId: string;
  defenderId: string;
  startTime: number;
  endTime: number;
  attackerPower: number;
  defenderPower: number;
  participants: Record<string, number>;
  isProcessed: boolean;
}

export interface Gang {
  id: string;
  name: string;
  owner: string;
  entryFee: number;
  membersCount: number;
  membersList: GangMember[];
  pendingApplications: GangMember[];
  socialLink?: string;
  logoUrl?: string;
  linkChangeCount: number;
  logoSet: boolean;
  activeWarId?: string;
}

export interface BattleRecord {
  won: boolean;
  rival: string;
  rivalId?: string; // Added for Revenge
  powerDiff: number;
  timestamp: number;
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

export interface PremiumMission {
  id: string;
  title: string;
  logo: string;
  link: string;
  waitTime: number; // in seconds
  reward: number;
  maxUsers: number;
  completedUserIds: string[];
  ownerId?: string;
}

export interface GlobalSettings {
  swapEnabled: boolean;
  withdrawalEnabled: boolean;
  maintenanceMode: boolean;
  premiumMissions: PremiumMission[];
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
  lastClaimDate: Date;
  lastTicketDate: Date;
  unclaimedFarming: number;
  language: Language;
  basePower: number; // New: Stats gained/lost in battle
  baseStatus: number; // New: Respect gained/lost in battle
  power: number; // Total Displayed Power
  status: number; // Total Displayed Respect
  inventory: Record<string, number>; // New: Buffs & Consumables
  ammo: number; // PvP Energy
  lastDailyAmmo: Date; // For daily reset
  pendingReferralBonus: number; // Anti-Fraud
  claimsCount: number; // Anti-Fraud
  xp: number; // RPG
  level: number; // RPG
  myGangId?: string;
  joinedGangId?: string;
  appliedGangId?: string;
  pendingFeeLock?: number;
  pvpHistory: BattleRecord[];
  isBanned?: boolean;
  isAdmin?: boolean;
  lastMissionDate?: string;
  completedMissions?: string[];
  hasSeenGuide?: boolean;
  referralStats?: {
    level1Count: number;
    level2Count: number;
    level3Count: number;
    level1Earnings: number;
    level2Earnings: number;
    level3Earnings: number;
  };
  totalFarmed?: number;
  totalPvPWon?: number;
  totalPvPLost?: number;
  totalRouletteSpent?: number;
  totalReferralBonus?: number; // New: Tracks CWARS earned from referrals
}

export interface RouletteResult {
  id: string;
  label: string;
  value: any;
  type: 'TON' | 'BOOST' | 'PIECE' | 'WEAPON' | 'MISS' | 'CWARS' | 'BUFF';
  probability: number;
}
