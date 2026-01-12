import mongoose, { Schema, Document, Model } from 'mongoose';
import { Rank } from '../types';

export interface IUser extends Document {
    telegramId: string;
    email: string;
    password?: string; // Optional if we decide to allow pure Telegram auth later, but mandatory for now
    name: string; // War Name / Alias
    rank: Rank;
    balance: number;
    cwarsBalance: number;
    tickets: number;
    referrals: number;
    referredBy?: string;
    referralStats?: {
        level1Count: number;
        level2Count: number;
        level3Count: number;
        level1Earnings: number;
        level2Earnings: number;
        level3Earnings: number;
    };
    basePower: number;
    baseStatus: number;
    ownedWeapons: any[]; // Define stricter schema if needed
    createdAt: Date;
    lastLogin: Date;
    isBanned: boolean;
    isAdmin: boolean;
}

const UserSchema: Schema = new Schema({
    telegramId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    rank: { type: String, default: Rank.INDEPENDIENTE },
    balance: { type: Number, default: 0.2 },
    cwarsBalance: { type: Number, default: 0 },
    tickets: { type: Number, default: 1 },
    referrals: { type: Number, default: 0 },
    referredBy: { type: String },
    basePower: { type: Number, default: 0 },
    baseStatus: { type: Number, default: 0 },
    ownedWeapons: { type: Array, default: [] },
    referralStats: {
        level1Count: { type: Number, default: 0 },
        level2Count: { type: Number, default: 0 },
        level3Count: { type: Number, default: 0 },
        level1Earnings: { type: Number, default: 0 },
        level2Earnings: { type: Number, default: 0 },
        level3Earnings: { type: Number, default: 0 }
    },
    isBanned: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent recompilation of model in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
