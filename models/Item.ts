import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IItem extends Document {
    id: string; // Unique string ID (e.g., 'glock', 'ammo_5')
    name: string;
    type: 'WEAPON' | 'AMMO' | 'BUFF';
    category?: string; // 'Pistola', 'Fusil', etc.
    level?: number;
    price: number;
    currency: 'TON' | 'CWARS';
    firepower?: number;
    miningPower?: number; // CWARS per Hour
    statusBonus?: number;
    image: string;
    description: string;
    isLimited?: boolean;
    stock?: number;
    order?: number; // For sorting in shop
}

const ItemSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['WEAPON', 'AMMO', 'BUFF'] },
    category: { type: String },
    level: { type: Number },
    price: { type: Number, required: true },
    currency: { type: String, required: true, enum: ['TON', 'CWARS'], default: 'CWARS' },
    firepower: { type: Number, default: 0 },
    miningPower: { type: Number, default: 0 },
    statusBonus: { type: Number, default: 0 },
    image: { type: String, required: true },
    description: { type: String },
    isLimited: { type: Boolean, default: false },
    stock: { type: Number },
    order: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent recompilation
const Item: Model<IItem> = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);

export default Item;
