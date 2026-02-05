import mongoose, { Schema, Document, Model } from 'mongoose';
import { Rank } from '../types.js';
import type { WeaponInstance } from '../types.js';

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

    inventory: Record<string, number>;
    ownedWeapons: WeaponInstance[]; // Define stricter schema if needed
    createdAt: Date;
    lastLogin: Date;
    lastEarningsUpdate: Date;



    totalReferralBonus: number; // New: Tracks CWARS earned from referrals
    isBanned: boolean;
    isAdmin: boolean;

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


    totalReferralBonus: { type: Number, default: 0 },

    // Anti-Fraud & Referral System

    inventory: { type: Map, of: Number, default: {} },

    lastEarningsUpdate: { type: Date, default: Date.now },
    ownedWeapons: { type: Array, default: [] },
    isBanned: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },

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
