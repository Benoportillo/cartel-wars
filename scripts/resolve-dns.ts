import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

// Set Cloudflare DNS
dns.setServers(['1.1.1.1', '1.0.0.1']);

const domain = 'warofclans-shard-00-00.uuucfuv.mongodb.net';

async function check() {
    console.log(`Resolving ${domain}...`);
    try {
        const ipv4 = await resolve4(domain);
        console.log('IPv4:', ipv4);
    } catch (e: any) {
        console.error('IPv4 Failed:', e.code);
    }

    try {
        const ipv6 = await resolve6(domain);
        console.log('IPv6:', ipv6);
    } catch (e: any) {
        console.error('IPv6 Failed:', e.code);
    }
}

check();
