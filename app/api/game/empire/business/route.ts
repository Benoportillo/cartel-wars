import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { BUILDINGS_DATA, STAFF_CATALOG } from '@/constants';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, action, targetId, slotIndex } = await req.json();
    // action: 'UPGRADE_BUILDING' | 'HIRE_STAFF'

    const user = await User.findOne({ telegramId: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (action === 'UPGRADE_BUILDING') {
        const buildingType = targetId as keyof typeof BUILDINGS_DATA;
        const buildingConfig = BUILDINGS_DATA[buildingType];

        if (!buildingConfig) return NextResponse.json({ error: 'Invalid building' }, { status: 400 });

        const currentLevels = user.buildings || {};
        const currentLevel = currentLevels.get(buildingType) || 0;
        const nextLevel = currentLevel + 1;

        if (nextLevel > 5) return NextResponse.json({ error: 'Max level reached' }, { status: 400 });

        const levelData = buildingConfig.levels.find((l: any) => l.level === nextLevel);
        if (!levelData) return NextResponse.json({ error: 'Level data error' }, { status: 500 });
        if (user.cwarsBalance < levelData.cost) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        // Deduct & Upgrade
        user.cwarsBalance -= levelData.cost;
        if (!user.buildings) user.buildings = new Map();
        user.buildings.set(buildingType, nextLevel);

        await user.save();
        return NextResponse.json({ success: true, building: { type: buildingType, level: nextLevel }, balance: user.cwarsBalance });
    }

    if (action === 'HIRE_STAFF') {
        // targetId = staffId (e.g. 'novice')
        const staffTemplate = STAFF_CATALOG.find((s: any) => s.id === targetId);
        if (!staffTemplate) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

        // Check Cost
        // For special staff like Heisenberg (TON), we'd need CheckTransaction logic. 
        // Assuming CWARS for now as per catalog standard.
        if (user.cwarsBalance < staffTemplate.cost) {
            return NextResponse.json({ error: 'Insufficient CWARS' }, { status: 400 });
        }

        // Check Slot Availability
        // We need to know which building to put them in. 
        // Staff template type 'VICE' -> 'vices', 'CHEM' -> 'chems'
        const buildingId = staffTemplate.type === 'VICE' ? 'vices' : 'chems';
        const buildingLvl = user.buildings?.get(buildingId) || 0;

        if (buildingLvl === 0) return NextResponse.json({ error: 'Building not owned' }, { status: 400 });

        // Get slots capacity
        const buildingConfig = BUILDINGS_DATA[buildingId];
        const lvlData = buildingConfig.levels.find((l: any) => l.level === buildingLvl);
        if (!lvlData) return NextResponse.json({ error: 'Level data error' }, { status: 500 });
        const maxSlots = lvlData.slots;

        // Check active staff in this building
        const activeInBuilding = user.staff?.filter(s => s.buildingId === buildingId) || [];

        // Slot logic: User sends 'slotIndex' (0 to maxSlots-1).
        if (slotIndex === undefined || slotIndex < 0 || slotIndex >= maxSlots) {
            return NextResponse.json({ error: 'Invalid slot index' }, { status: 400 });
        }

        // Check if slot is occupied
        const isOccupied = activeInBuilding.some((s: any) => s.slotIndex === slotIndex && new Date(s.expiresAt) > new Date());
        if (isOccupied) return NextResponse.json({ error: 'Slot occupied' }, { status: 400 });

        // HIRE
        user.cwarsBalance -= staffTemplate.cost;

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + staffTemplate.durationHours);

        const newContract = {
            instanceId: randomUUID(),
            staffId: staffTemplate.id,
            buildingId: buildingId,
            slotIndex: slotIndex,
            expiresAt: expiresAt
        };

        if (!user.staff) user.staff = [];
        // Remove old contract in this slot if exists (expired one)
        user.staff = user.staff.filter((s: any) => !(s.buildingId === buildingId && s.slotIndex === slotIndex));
        user.staff.push(newContract);

        await user.save();
        return NextResponse.json({ success: true, contract: newContract, balance: user.cwarsBalance });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
