import mongoose from 'mongoose';
import User from '../models/User.ts';
import { WEAPONS } from '../constants.ts';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fix() {
    console.log("URI provided:", process.env.MONGODB_URI ? "YES" : "NO");
    if (!process.env.MONGODB_URI) { console.error("No Mongo URI"); return; }
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        const oldPower = user.power;

        // Recalculate Mining Power (Economy Rate)
        const newPower = user.ownedWeapons.reduce((sum, w) => {
            const def = WEAPONS.find(d => d.id === w.weaponId);
            return sum + (def?.miningPower || 0);
        }, 0) + (user.basePower || 0);

        if (oldPower !== newPower) {
            console.log(`Updating ${user.name}: ${oldPower} -> ${newPower}`);
            user.power = newPower;
            await user.save();
        }
    }
    console.log("Done.");
    process.exit();
}

fix();
