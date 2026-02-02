
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('No MONGODB_URI found');
    process.exit(1);
}

async function checkDB() {
    console.log('Connecting to:', MONGODB_URI?.split('@')[1]); // Hide creds
    try {
        const conn = await mongoose.connect(MONGODB_URI!);
        console.log('Connected!');
        console.log('Database Name:', conn.connection.db.databaseName);

        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        if (collections.find(c => c.name === 'users')) {
            const count = await conn.connection.db.collection('users').countDocuments();
            console.log('User count:', count);

            const users = await conn.connection.db.collection('users').find({}).limit(5).toArray();
            console.log('Sample Users:', users.map(u => ({ name: u.name, balance: u.balance, cwars: u.cwarsBalance })));
        } else {
            console.log('No "users" collection found.');
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error('Error:', e);
    }
}

checkDB();
