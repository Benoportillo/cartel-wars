
import TonWeb from 'tonweb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MASTER_WALLET_ADDRESS = "UQDZDP9qAdglpsThm7XFhSGKjFhx98nJj6IzGI0yh-rop7H7";
const API_KEY = process.env.TONCENTER_API_KEY;

const run = async () => {
    console.log('🔍 Debugging TON Transactions...');
    console.log(`🔑 API Key Present: ${!!API_KEY}`);

    const tonweb = new TonWeb(new TonWeb.HttpProvider(
        'https://toncenter.com/api/v2/json',
        API_KEY ? { apiKey: API_KEY } : undefined
    ));

    try {
        console.log(`📡 Fetching transactions for ${MASTER_WALLET_ADDRESS}...`);
        const history = await tonweb.getTransactions(MASTER_WALLET_ADDRESS, 10);

        console.log(`✅ Found ${history.length} transactions.`);

        history.forEach((tx: any, index: number) => {
            console.log(`\n---------------- TX ${index + 1} ----------------`);
            console.log(`Hash: ${tx.transaction_id.hash}`);
            console.log(`Value: ${tx.in_msg?.value}`);

            if (tx.in_msg) {
                console.log('--- IN_MSG BODY ---');
                console.log('Message Field:', tx.in_msg.message);
                console.log('Msg Data:', JSON.stringify(tx.in_msg.msg_data, null, 2));

                if (tx.in_msg.msg_data && tx.in_msg.msg_data.text) {
                    console.log('Raw Text Base64?:', tx.in_msg.msg_data.text);
                    try {
                        const buffer = Buffer.from(tx.in_msg.msg_data.text, 'base64');
                        console.log('Decoded UTF-8:', buffer.toString('utf-8'));
                    } catch (e) {
                        console.log('Decode Error:', e);
                    }
                }
            } else {
                console.log('No Incoming Message (likely outgoing tx or internal)');
            }
        });

    } catch (error) {
        console.error('❌ Error fetching transactions:', error);
    }
};

run();
