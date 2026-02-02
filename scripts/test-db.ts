import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('URI present:', !!MONGODB_URI);

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing from .env.local');
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('Connecting (forcing IPv4)...');
        await mongoose.connect(MONGODB_URI!, {
            serverSelectionTimeoutMS: 5000,
            family: 4 // Force IPv4
        });
        console.log('✅ Connection Successful!');
        console.log('State:', mongoose.connection.readyState);
        await mongoose.disconnect();
        console.log('Disconnected.');
    } catch (error: any) {
        console.error('❌ Connection Failed:', error.message);
        console.error('Check your MongoDB Atlas IP Whitelist.');
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testConnection();
