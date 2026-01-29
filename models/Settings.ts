import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    swapEnabled: { type: Boolean, default: true },
    withdrawalEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    premiumMissions: { type: Array, default: [] },
    referralCommissionPercent: { type: Number, default: 0.15 },
    gangsterHours: [{
        start: Number,
        end: Number,
        bonus: Number
    }],
    lastGangsterUpdate: Number
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
