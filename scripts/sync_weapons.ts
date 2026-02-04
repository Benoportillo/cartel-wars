import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { WEAPONS } from '../constants.js'; // Ensure extension matches or is resolved
import Item from '../models/Item.js';

// Load env vars
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing from .env.local');
    process.exit(1);
}

async function syncWeapons() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI!, {
            family: 4 // Force IPv4
        });
        console.log('✅ Connected.');

        console.log('🚀 Syncing Weapons...');

        for (const weapon of WEAPONS) {
            console.log(`Processing ${weapon.name}...`);

            // Map Weapon to Item schema
            const itemData = {
                id: weapon.id,
                name: weapon.name,
                type: 'WEAPON',
                category: weapon.category,
                level: weapon.level,
                price: weapon.price,
                currency: 'TON', // Weapons in constants seem to be priced in TON
                firepower: weapon.firepower,
                miningPower: weapon.miningPower,
                statusBonus: weapon.statusBonus,
                image: weapon.image,
                description: weapon.description,
                isLimited: (weapon as any).isLimited || false
            };

            await Item.findOneAndUpdate(
                { id: weapon.id },
                { $set: itemData },
                { upsert: true, new: true }
            );
            console.log(`   ✅ Updated/Created: ${weapon.name}`);
        }

        console.log('✨ All weapons synced successfully!');

    } catch (error) {
        console.error('❌ Sync Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

syncWeapons();
