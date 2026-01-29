import { NextResponse } from 'next/server';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import dbConnect from '@/lib/dbConnect';
import TonWeb from 'tonweb';
import { WITHDRAWAL_WALLET_ADDRESS } from '@/constants';

const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/json'));

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { userId, amount, address } = await req.json();

        if (!userId || !amount || !address) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const withdrawAmount = Number(amount);
        if (withdrawAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if ((user.balance || 0) < withdrawAmount) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        // 5% Fee
        const fee = withdrawAmount * 0.05;
        const netAmount = withdrawAmount - fee;

        // Deduct Balance
        user.balance -= withdrawAmount;
        user.tonWithdrawn = (user.tonWithdrawn || 0) + withdrawAmount;
        await user.save();

        // Create Transaction Record
        const txRecord = await Transaction.create({
            userId: user.telegramId,
            userName: user.name,
            type: 'withdrawal',
            amount: withdrawAmount,
            currency: 'TON',
            txid: address, // Temporary until we have hash
            status: 'pending'
        });

        // AUTOMATIC WITHDRAWAL LOGIC
        let withdrawalTxHash = "";
        let message = "Retiro procesado. Los fondos llegarán en breve.";

        const mnemonic = process.env.WITHDRAWAL_MNEMONIC;

        if (mnemonic) {
            try {
                const keyPair = await tonweb.mnemonic.toKeyPair(mnemonic.split(' '));
                const WalletClass = tonweb.wallet.all.v4R2;
                const wallet = new WalletClass(tonweb.provider, {
                    publicKey: keyPair.publicKey,
                    wc: 0
                });

                const seqno = await wallet.methods.seqno().call() || 0;

                // Send Transfer
                const transfer = await wallet.methods.transfer({
                    secretKey: keyPair.secretKey,
                    toAddress: address,
                    amount: TonWeb.utils.toNano(netAmount.toString()),
                    seqno: seqno,
                    payload: 'Cartel Wars Withdrawal',
                    sendMode: 3,
                }).send();

                withdrawalTxHash = "pending_chain_sync";
                txRecord.status = 'completed'; // Optimistic
                await txRecord.save();

                message = "¡Retiro enviado a la Blockchain!";
                console.log(`✅ Automatic Withdrawal Sent: ${netAmount} TON to ${address}`);

            } catch (txError) {
                console.error("Automatic Withdrawal Failed:", txError);
                message = "Error en envío automático. Contacta soporte.";
                txRecord.status = 'failed';
                await txRecord.save();
            }
        } else {
            console.log(`[MANUAL ACTION REQUIRED] Send ${netAmount} TON to ${address}`);
            message = "Solicitud recibida. Procesando manualmente (Falta Mnemonic).";
        }

        return NextResponse.json({
            success: true,
            newBalance: user.balance,
            fee,
            netAmount,
            message
        });

    } catch (error) {
        console.error('Withdraw Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
