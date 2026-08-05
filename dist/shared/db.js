"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const dns_1 = __importDefault(require("dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("./logger"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const dnsServers = ['1.1.1.1', '8.8.8.8'];
const resolveSrvWithNslookup = async (srvName) => {
    const { stdout, stderr } = await execAsync(`nslookup -type=SRV ${srvName}`);
    const output = [stdout, stderr].filter(Boolean).join('\n');
    if (!output) {
        throw new Error(`nslookup returned no output for ${srvName}`);
    }
    logger_1.default.info({ output }, 'nslookup raw output');
    if (stderr) {
        logger_1.default.warn({ stderr }, 'nslookup returned stderr while resolving SRV');
    }
    const lines = output.split(/\r?\n/);
    const records = [];
    let currentRecord = {};
    const fieldRegex = /^(.+?)\s*=\s*(.+)$/i;
    for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(fieldRegex);
        if (!match)
            continue;
        const field = match[1].toLowerCase();
        const value = match[2].trim();
        if (field === 'priority') {
            currentRecord.priority = Number(value);
        }
        else if (field === 'weight') {
            currentRecord.weight = Number(value);
        }
        else if (field === 'port') {
            currentRecord.port = Number(value);
        }
        else if (field === 'svr hostname' || field === 'target' || field === 'srv hostname') {
            currentRecord.name = value.replace(/\.$/, '');
        }
        if (currentRecord.name &&
            currentRecord.port !== undefined &&
            currentRecord.priority !== undefined &&
            currentRecord.weight !== undefined) {
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
const getNormalizedMongoUrl = async (databaseUrl) => {
    if (!databaseUrl.startsWith('mongodb+srv://')) {
        return databaseUrl;
    }
    dns_1.default.setServers(dnsServers);
    const url = new URL(databaseUrl);
    const srvName = `_mongodb._tcp.${url.hostname}`;
    let records;
    try {
        logger_1.default.info({ srvName, dnsServers }, 'Attempting SRV resolution using dns.promises.resolveSrv');
        records = await dns_1.default.promises.resolveSrv(srvName);
        logger_1.default.info({ records }, 'SRV resolution succeeded using dns.promises.resolveSrv');
    }
    catch (error) {
        logger_1.default.warn({ error }, 'dns.resolveSrv failed, falling back to nslookup');
        records = await resolveSrvWithNslookup(srvName);
        logger_1.default.info({ records }, 'SRV resolution succeeded using nslookup fallback');
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
const connectDB = async () => {
    const normalizedUrl = await getNormalizedMongoUrl(config_1.default.databaseUrl);
    const connectionOptions = {
        maxPoolSize: 100,
        minPoolSize: 10,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        tls: /(^|[&?])tls=true/.test(normalizedUrl),
    };
    try {
        await mongoose_1.default.connect(normalizedUrl, connectionOptions);
        logger_1.default.info('MongoDB connected successfully with connection pool (max 100)');
        return normalizedUrl;
    }
    catch (error) {
        logger_1.default.error(error, 'Failed to connect MongoDB');
        process.exit(1);
    }
};
exports.default = connectDB;
// import mongoose from 'mongoose';
// import config from '../config/index';
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
