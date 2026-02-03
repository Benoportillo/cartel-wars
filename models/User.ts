import mongoose, { Schema, Document, Model } from 'mongoose';
import { Rank } from '../types.js';
import type { WeaponInstance, BattleRecord } from '../types.js';

export interface IUser extends Document {
    telegramId: string;
    email: string;
    password?: string; // Optional if we decide to allow pure Telegram auth later, but mandatory for now
    name: string; // War Name / Alias
    rank: Rank;
    balance: number;
    cwarsBalance: number;
    tonWithdrawn: number;
    tickets: number;
    referrals: number;
    referredBy?: string;
    basePower: number;
    baseStatus: number;
    xp: number;
    level: number;

    ammo: number;
    lastDailyAmmo: Date;
    inventory: Record<string, number>;
    ownedWeapons: WeaponInstance[]; // Define stricter schema if needed
    createdAt: Date;
    lastLogin: Date;
    lastEarningsUpdate: Date;

    totalPvPWon: number;
    totalPvPLost: number;

    totalReferralBonus: number; // New: Tracks CWARS earned from referrals
    isBanned: boolean;
    isAdmin: boolean;
    pvpHistory: BattleRecord[];
    pvpBattlesPlayed?: number; // New: Track battles for referral requirement
    referrerBonusPaid?: boolean; // New: Track if referrer has been paid
    lastTicketDate?: Date;
    nameChanged?: boolean;
    lastRaceDate?: Date;
    myGangId?: string;
    joinedGangId?: string;
    appliedGangId?: string;
    pendingFeeLock?: number;
    lastMissionDate?: Date;
    completedMissions?: string[];
    hasSeenGuide?: boolean;
}

const UserSchema: Schema = new Schema({
    telegramId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    rank: { type: String, default: Rank.INDEPENDIENTE },
    balance: { type: Number, default: 0.2 },
    cwarsBalance: { type: Number, default: 0 },
    tonWithdrawn: { type: Number, default: 0 },
    tickets: { type: Number, default: 1 },
    referrals: { type: Number, default: 0 },
    referredBy: { type: String },

    basePower: { type: Number, default: 0 },
    baseStatus: { type: Number, default: 0 },

    // Stats for Dashboard

    totalPvPWon: { type: Number, default: 0 },
    totalPvPLost: { type: Number, default: 0 },
    totalReferralBonus: { type: Number, default: 0 },

    // Anti-Fraud & Referral System

    inventory: { type: Map, of: Number, default: {} },
    ammo: { type: Number, default: 10 },
    lastDailyAmmo: { type: Date, default: Date.now },
    lastEarningsUpdate: { type: Date, default: Date.now },
    ownedWeapons: { type: Array, default: [] },
    isBanned: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    pvpHistory: { type: Array, default: [] },
    pvpBattlesPlayed: { type: Number, default: 0 },
    referrerBonusPaid: { type: Boolean, default: false },
    lastTicketDate: { type: Date },
    nameChanged: { type: Boolean, default: false },
    lastRaceDate: { type: Date },
    myGangId: { type: String },
    joinedGangId: { type: String },
    appliedGangId: { type: String },
    pendingFeeLock: { type: Number },
    lastMissionDate: { type: Date },
    completedMissions: { type: [String], default: [] },
    hasSeenGuide: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent recompilation of model in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
