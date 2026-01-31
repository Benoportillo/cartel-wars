---
name: implement_telegram_referrals
description: Implement a multi-level (Tier 1, 2, 3) referral system for Telegram Mini Apps using Next.js and MongoDB. Includes frontend detection, backend processing, and schema definitions.
---

# Implement Telegram Referral System

This skill guides you through adding a robust, multi-level referral system to your Telegram Mini App. It handles reference detection, user registration attribution, and commission/bonus distribution.

## 1. Database Schema (`User.ts`)

Add the following fields to your Mongoose User Schema to track referrals and earnings.

```typescript
// Interface
export interface IUser extends Document {
    // ... existing fields
    referrals: number;          // Total count of direct recruits
    referredBy?: string;        // ID of the user who invited this user
    totalReferralBonus: number; // Total currency earned from referrals
    referralStats?: {           // Breakdown by level
        level1Count: number;
        level2Count: number;
        level3Count: number;
        level1Earnings: number;
        level2Earnings: number;
        level3Earnings: number;
    };
}

// Schema Definition
const UserSchema = new Schema({
    // ... existing fields
    referrals: { type: Number, default: 0 },
    referredBy: { type: String },
    totalReferralBonus: { type: Number, default: 0 }, 
    referralStats: {
        level1Count: { type: Number, default: 0 },
        level2Count: { type: Number, default: 0 },
        level3Count: { type: Number, default: 0 },
        level1Earnings: { type: Number, default: 0 },
        level2Earnings: { type: Number, default: 0 },
        level3Earnings: { type: Number, default: 0 }
    }
});
```

## 2. Frontend Detection (`Auth.tsx`)

Capture the referral code from the Telegram WebApp `start_param` or URL parameters.

```tsx
useEffect(() => {
    const detectReferral = () => {
        let ref = '';

        // 1. Priority: Telegram WebApp Init Data
        // @ts-ignore
        if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
            // @ts-ignore
            ref = window.Telegram.WebApp.initDataUnsafe.start_param;
        }

        // 2. Fallback: URL Search Params
        if (!ref) {
            const params = new URLSearchParams(window.location.search);
            ref = params.get('start') || params.get('startapp') || params.get('tgWebAppStartParam') || '';
        }

        // 3. Fallback: LocalStorage (Persistence)
        if (!ref) {
            ref = localStorage.getItem('pending_ref') || '';
        }

        // Validate and Save
        if (ref && ref !== 'undefined') {
            console.log("✅ Referral Detected:", ref);
            localStorage.setItem('pending_ref', ref);
            
            // Update your form state or context here
            // setReferralCode(ref); 
        }
    };

    detectReferral();
}, []);
```

## 3. Backend Registration Logic (`api/auth/register/route.ts`)

Process the referral during user creation. This example implements a 3-Level system (e.g., commissions or stats).

```typescript
// On POST /api/register
// Extract 'referredBy' from body

if (referredBy) {
    // 1. Verify Referrer Exists
    const recruiterL1 = await User.findOne({ telegramId: referredBy });

    if (recruiterL1) {
        // --- LEVEL 1 (Direct Invite) ---
        recruiterL1.referrals += 1;
        recruiterL1.referralStats.level1Count += 1;
        
        // Award Bonus (Example: 5000 Coins)
        const bonus = 5000;
        recruiterL1.balance = (recruiterL1.balance || 0) + bonus;
        recruiterL1.totalReferralBonus = (recruiterL1.totalReferralBonus || 0) + bonus;
        
        await recruiterL1.save();

        // --- LEVEL 2 (Grandparent) ---
        if (recruiterL1.referredBy) {
            const recruiterL2 = await User.findOne({ telegramId: recruiterL1.referredBy });
            if (recruiterL2) {
                recruiterL2.referralStats.level2Count += 1;
                // Add L2 Commission logic here if needed
                await recruiterL2.save();

                // --- LEVEL 3 (Great-Grandparent) ---
                if (recruiterL2.referredBy) {
                    const recruiterL3 = await User.findOne({ telegramId: recruiterL2.referredBy });
                    if (recruiterL3) {
                        recruiterL3.referralStats.level3Count += 1;
                        // Add L3 Commission logic here if needed
                        await recruiterL3.save();
                    }
                }
            }
        }
    }
}

// Create New User
const newUser = new User({
    // ...
    referredBy: recruiterL1 ? referredBy : undefined // Only save if valid
});
```

## 4. Telegram Link Format

To invoke this system, generate links for your users in this format:

```javascript
const botUsername = "YourBotName_bot";
const appName = "myapp"; // Your Mini App shortname
const userId = "123456789";

const referralLink = `https://t.me/${botUsername}/${appName}?startapp=${userId}`;
```

When a new user clicks this link, Telegram opens your Mini App provided in `appName` and passes `${userId}` as the `start_param`, triggering the detection logic in Step 2.
