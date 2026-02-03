
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testPersistence() {
    console.log("🧪 Starting Persistence Test...");

    // Dynamic imports to ensure env vars are loaded first
    const { default: mongoose } = await import('mongoose');
    const { default: User } = await import('../models/User.js');
    const { default: dbConnect } = await import('../lib/dbConnect.js');
    const { Economy } = await import('../lib/economy.js');

    try {
        await dbConnect();
        console.log("✅ DB Connected");

        // 1. Create or Get Test User
        const testId = "TEST_PERSISTENCE_" + Date.now();
        const user = await User.create({
            telegramId: testId,
            name: "Test User",
            email: testId + "@test.com",
            password: "hashedpassword",
            cwarsBalance: 1000,
            power: 3600, // 3600/hr = 1/sec
            lastClaimDate: new Date(Date.now() - 10000), // 10 seconds ago
            ownedWeapons: [{ weaponId: 'starter', caliberLevel: 1, magazineLevel: 1, accessoryLevel: 1, skin: '#333333' }]
        });

        console.log(`👤 Created User: ${user.telegramId} | Balance: ${user.cwarsBalance} | LastClaim: ${user.lastClaimDate.toISOString()}`);

        // 2. Test Economy Calculation
        console.log("🔄 Running Economy.crystallizeEarnings...");

        // Simulate 10 seconds passing (already in lastClaimDate)
        // Economy.crystallizeEarnings uses 'now' vs 'lastClaimDate'
        const beforeSave = user.cwarsBalance;
        Economy.crystallizeEarnings(user, new Date());
        const afterCalc = user.cwarsBalance;

        console.log(`🧮 Calculation: ${beforeSave} -> ${afterCalc}`);

        if (afterCalc <= beforeSave) {
            console.error("❌ Economy logic failed to increase balance!");
        } else {
            console.log("✅ Economy logic increased balance.");
        }

        // 3. Test Saving
        console.log("💾 Saving to DB...");
        await user.save();
        console.log("✅ Save promise resolved.");

        // 4. Fetch Check
        console.log("🔍 Refetching user from DB...");
        const refetched = await User.findOne({ telegramId: testId });

        console.log(`📦 Refetched Balance: ${refetched?.cwarsBalance}`);

        if (refetched && refetched.cwarsBalance === afterCalc) {
            console.log("✅ SUCCESS: Balance persisted correctly.");
        } else {
            console.error(`❌ FAILURE: DB has ${refetched?.cwarsBalance}, expected ${afterCalc}`);
        }

        // Cleanup
        await User.deleteOne({ telegramId: testId });
        console.log("🧹 Cleanup done.");

    } catch (e) {
        console.error("💥 Verify Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

testPersistence();
