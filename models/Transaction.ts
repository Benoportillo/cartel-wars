import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
    userId: string;
    userName: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    currency: 'TON' | 'CWARS';
    txid: string; // Hash for deposits, Address for withdrawals (or Hash if completed)
    status: 'pending' | 'completed' | 'failed';
    timestamp: Date;
}

const TransactionSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    userName: { type: String },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'TON' },
    txid: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    timestamp: { type: Date, default: Date.now }
});

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
