import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';
import mongoose from 'mongoose';
import config from '@/config';
import logger from './logger';

const execAsync = promisify(exec);
const dnsServers = ['1.1.1.1', '8.8.8.8'];

const resolveSrvWithNslookup = async (srvName: string) => {
    const { stdout, stderr } = await execAsync(`nslookup -type=SRV ${srvName}`);
    const output = [stdout, stderr].filter(Boolean).join('\n');
    if (!output) {
        throw new Error(`nslookup returned no output for ${srvName}`);
    }

    logger.info({ output }, 'nslookup raw output');
    if (stderr) {
        logger.warn({ stderr }, 'nslookup returned stderr while resolving SRV');
    }

    const lines = output.split(/\r?\n/);
    const records: Array<{ name: string; port: number; priority: number; weight: number }> = [];
    let currentRecord: Partial<{ name: string; port: number; priority: number; weight: number }> = {};
    const fieldRegex = /^(.+?)\s*=\s*(.+)$/i;

    for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(fieldRegex);
        if (!match) continue;

        const field = match[1].toLowerCase();
        const value = match[2].trim();

        if (field === 'priority') {
            currentRecord.priority = Number(value);
        } else if (field === 'weight') {
            currentRecord.weight = Number(value);
        } else if (field === 'port') {
            currentRecord.port = Number(value);
        } else if (field === 'svr hostname' || field === 'target' || field === 'srv hostname') {
            currentRecord.name = value.replace(/\.$/, '');
        }

        if (
            currentRecord.name &&
            currentRecord.port !== undefined &&
            currentRecord.priority !== undefined &&
            currentRecord.weight !== undefined
        ) {
            records.push({
                name: currentRecord.name,
                port: currentRecord.port,
                priority: currentRecord.priority,
                weight: currentRecord.weight,
            });
            currentRecord = {};
        }
    }

    if (records.length === 0) {
        throw new Error(`SRV lookup via nslookup returned no records for ${srvName}. Output: ${output}`);
    }

    return records;
};

const getNormalizedMongoUrl = async (databaseUrl: string): Promise<string> => {
    if (!databaseUrl.startsWith('mongodb+srv://')) {
        return databaseUrl;
    }

    dns.setServers(dnsServers);
    const url = new URL(databaseUrl);
    const srvName = `_mongodb._tcp.${url.hostname}`;

    let records;
    try {
        logger.info({ srvName, dnsServers }, 'Attempting SRV resolution using dns.promises.resolveSrv');
        records = await dns.promises.resolveSrv(srvName);
        logger.info({ records }, 'SRV resolution succeeded using dns.promises.resolveSrv');
    } catch (error) {
        logger.warn({ error }, 'dns.resolveSrv failed, falling back to nslookup');
        records = await resolveSrvWithNslookup(srvName);
        logger.info({ records }, 'SRV resolution succeeded using nslookup fallback');
    }

    const hosts = records.map((record) => `${record.name}:${record.port}`).join(',');
    const auth = url.username
        ? `${encodeURIComponent(url.username)}${url.password ? `:${encodeURIComponent(url.password)}` : ''}@`
        : '';
    const pathname = url.pathname || '';
    const params = new URLSearchParams(url.searchParams);

    if (!params.has('tls') && !params.has('ssl')) {
        params.set('tls', 'true');
    }

    if (url.username && !params.has('authSource')) {
        params.set('authSource', 'admin');
    }

    return `mongodb://${auth}${hosts}${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
};

const connectDB = async (): Promise<string> => {
    const normalizedUrl = await getNormalizedMongoUrl(config.databaseUrl);
    const connectionOptions = {
        maxPoolSize: 100,
        minPoolSize: 10,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        tls: /(^|[&?])tls=true/.test(normalizedUrl),
    };

    try {
        await mongoose.connect(normalizedUrl, connectionOptions);

        logger.info('MongoDB connected successfully with connection pool (max 100)');
        return normalizedUrl;
    } catch (error) {
        logger.error(error, 'Failed to connect MongoDB');
        process.exit(1);
    }
};

export default connectDB;

// import mongoose from 'mongoose';
// import config from '@/config/index';
// import logger from './logger';

// const connectDB = async (): Promise<void> => {
//     try {
//         await mongoose.connect(config.databaseUrl as string);
//         logger.info('MongoDB connected successfully');
//     } catch (error) {
//         logger.error(error, 'Failed to connect to MongoDB');
//         process.exit(1);
//     }
// };

// export default connectDB;
