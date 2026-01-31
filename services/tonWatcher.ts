import TonWeb from 'tonweb';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { MASTER_WALLET_ADDRESS } from '../constants.js';

const TonWebClass = (TonWeb as any).default || TonWeb;

// Lazy initialization inside startTonWatcher to ensuring ENV is loaded
export const startTonWatcher = (io: any) => {
    const apiKey = process.env.TONCENTER_API_KEY;
    console.log(`👀 Starting TON Watcher...`);
    console.log(`🔑 API Key Configured: ${apiKey ? `YES (Length: ${apiKey.length})` : 'NO'}`);
    if (apiKey) console.log(`🔑 Key Preview: ${apiKey.substring(0, 5)}...`);

    const tonweb = new (TonWebClass as any)(new (TonWebClass as any).HttpProvider(
        'https://toncenter.com/api/v2/json',
        apiKey ? { apiKey } : undefined
    ));

    console.log('✅ Connected to TonCenter V2:', MASTER_WALLET_ADDRESS);

    // In-memory cache
    const processedTxIds = new Set<string>();

    setInterval(async () => {
        try {
            const history = await tonweb.getTransactions(MASTER_WALLET_ADDRESS, 10);

            for (const tx of history) {
                const txHash = tx.transaction_id.hash;
                const inMsg = tx.in_msg;

                // Only process incoming transfers with value
                if (!inMsg || inMsg.value <= 0) continue;

                // Check if already processed in DB
                const exists = await Transaction.findOne({ txid: txHash });
                if (exists || processedTxIds.has(txHash)) continue;

                processedTxIds.add(txHash);

                console.log(`Processing New TX: ${txHash}`);

                // 1. Create PENDING Transaction Record
                let transactionRecord;
                try {
                    transactionRecord = await Transaction.create({
                        userId: "unknown", // Temporary
                        userName: "Unknown",
                        type: 'deposit',
                        amount: Number(inMsg.value) / 1e9,
                        currency: 'TON',
                        txid: txHash,
                        status: 'pending'
                    });
                } catch (dbError) {
                    console.error(`Error creating initial transaction record for ${txHash}`, dbError);
                    continue; // Skip if we can't even log the invalid tx
                }


                // Parse Memo (Comment) to get User ID
                // --- ROBUST COMMENT EXTRACTION ---
                let userId = "";

                // debug log the entire inMsg to help us fix it if this fails
                console.log(`🔍 Processing TX ${txHash.substring(0, 8)}... Value: ${inMsg.value}`);
                // console.log('RAW MSG:', JSON.stringify(inMsg, null, 2)); // Uncomment if needed

                // Strategy 1: Check msg_data (Toncenter V2 Standard)
                if (inMsg.msg_data) {
                    if (inMsg.msg_data['@type'] === 'msg.dataText') {
                        const rawText = inMsg.msg_data.text;
                        if (rawText) {
                            try {
                                // Toncenter sometimes returns Base64, sometimes Raw.
                                // If it assumes Base64, let's try to decode.
                                // A pure numeric string like "12345" in base64 is "MTIzNDU=".
                                // Cleaning it first:
                                const buffer = Buffer.from(rawText, 'base64');
                                const decoded = buffer.toString('utf-8');

                                // Heuristic: If decoded looks like a number, use it. If not, maybe it was already raw?
                                if (/^\d+$/.test(decoded)) {
                                    userId = decoded;
                                    console.log(`🔓 Decoded Base64 Comment: ${userId}`);
                                } else if (/^\d+$/.test(rawText)) {
                                    userId = rawText;
                                    console.log(`🔓 Found Raw Text Comment: ${userId}`);
                                } else {
                                    // Maybe it's not base64. Let's assume it is the ID if it fits format.
                                    userId = rawText; // Fallback
                                }
                            } catch (e) {
                                userId = rawText;
                            }
                        }
                    } else if (inMsg.msg_data['@type'] === 'msg.dataRaw') {
                        console.log('⚠️ Body is Raw BOC, attempting to parse...');
                        try {
                            const body = inMsg.msg_data.body;
                            // Convert Base64 to Bytes
                            const bytes = TonWebClass.utils.base64ToBytes(body);
                            // Parse Cell
                            const cell = TonWebClass.boc.Cell.oneFromBoc(bytes);
                            const slice = cell.beginParse();

                            // Check OpCode (First 32 bits)
                            // Note: Comments usually have OpCode 0.
                            // If the payload is JUST a string without opcode 0, loadString directly might fail or return garbage if not careful.
                            // But standard comments (like from WalletModal) use OpCode 0.
                            if (slice.getRemainingBits() >= 32) {
                                const opcode = slice.loadUint(32).toNumber();
                                if (opcode === 0) {
                                    const comment = slice.loadString();
                                    userId = comment.trim(); // Clean it
                                    console.log(`🔓 Decoded BOC Comment (OpCode 0): ${userId}`);
                                } else {
                                    console.log(`⚠️ Unknown OpCode in BOC: ${opcode}. Parsing remaining as text anyway...`);
                                    // Fallback: maybe the whole thing is text? Or ignore?
                                    // Let's try to read string just in case, but usually OpCode 0 is mandatory for text.
                                }
                            } else {
                                // Maybe no OpCode? Just text?
                                const comment = slice.loadString();
                                userId = comment.trim();
                                console.log(`🔓 Decoded BOC Comment (No OpCode): ${userId}`);
                            }

                        } catch (e) {
                            console.error('❌ Failed to parse BOC body:', e);
                        }
                    }
                }

                // Strategy 2: Fallback to 'message' field (TonWeb pre-parsed?)
                if (!userId && inMsg.message && typeof inMsg.message === 'string') {
                    userId = inMsg.message;
                    console.log(`🔓 Found 'message' field: ${userId}`);
                }

                console.log(`🧐 Extracted UserID: "${userId}"`);

                if (!userId) {
                    console.log('❌ Could not extract User ID from deposit.');
                    transactionRecord.status = 'failed';
                    await transactionRecord.save();
                    continue;
                }

                // Update Transaction with User ID found
                transactionRecord.userId = userId;

                const user = await User.findOne({ telegramId: userId });
                if (!user) {
                    console.log(`Received deposit from unknown user: ${userId}`);
                    transactionRecord.status = 'failed'; // Or keep pending if we want manual intervention
                    await transactionRecord.save();
                    continue;
                }

                // Update Transaction with User Name
                transactionRecord.userName = user.name;
                await transactionRecord.save();

                const amountTon = Number(inMsg.value) / 1e9; // Nanotons to TON

                // Apply Gangster Bonus (Random logic or fixed for now)
                // We can check GlobalSettings if we implemented them.
                // For now, let's give a 5% bonus always for automation incentive.
                const bonus = amountTon * 0.05;
                const totalCredit = amountTon + bonus;

                // 2. Update User Balance
                user.balance += totalCredit;
                await user.save();

                // 3. Mark Transaction as Completed
                transactionRecord.status = 'completed';
                await transactionRecord.save();

                console.log(`✅ Deposit Processed: ${amountTon} TON for ${user.name}`);

                // Emit Socket Event
                io.to(`user_${user.telegramId}`).emit('balance_update', {
                    newBalance: user.balance,
                    message: `¡Depósito recibido! +${amountTon} TON (+${bonus.toFixed(2)} Bonus)`
                });
            }

        } catch (error: any) {
            // Handle expected API errors (Rate limiting or empty response)
            if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')) {
                console.warn('⚠️ TON API Rate Limit or Empty Response. Retrying next cycle...');
            } else if (error?.message?.includes('fetch failed')) {
                console.warn('⚠️ TON Network Connection Error. Retrying...');
            } else {
                console.error('Watcher Error:', error);
            }
        }
    }, 10000); // Poll every 10 seconds
};

