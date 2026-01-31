import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { startTonWatcher } from './services/tonWatcher.ts';


const dev = process.env.NODE_ENV !== 'production';
const app = (next as any)({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server);

    // Connect to DB
    // Connect to DB
    mongoose.connect(process.env.MONGODB_URI!)
        .then(() => {
            console.log('🍃 MongoDB Connected via Server');
            // Start Watcher
            try {
                startTonWatcher(io);
            } catch (e) {
                console.error('Failed to start TON Watcher:', e);
            }
        })
        .catch((err: any) => console.error('MongoDB Error:', err));

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join_user', (userId) => {
            console.log(`User ${userId} joined room user_${userId}`);
            socket.join(`user_${userId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    // Make io accessible globally
    (global as any).io = io;

    server.listen(3000, () => {
        console.log('> Ready on http://localhost:3000');
    });
});
