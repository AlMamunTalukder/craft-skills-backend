"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../shared/logger"));
// One-time cleanup: the old visitor-tracking flow wrote one document per visitor,
// which bloated the free-tier MongoDB. The timer is now stateless (cookie-based),
// so this collection is no longer needed and can be emptied.
const cleanup = async () => {
    await mongoose_1.default.connect(config_1.default.databaseUrl, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        tls: true,
    });
    const db = mongoose_1.default.connection.db;
    if (!db) {
        logger_1.default.error('Failed to get database handle');
        process.exit(1);
    }
    const collection = db.collection('exclusivevisitors');
    const result = await collection.deleteMany({});
    logger_1.default.info(`Deleted ${result.deletedCount} documents from "exclusivevisitors"`);
    await mongoose_1.default.disconnect();
    logger_1.default.info('Cleanup completed');
    process.exit(0);
};
cleanup().catch((error) => {
    logger_1.default.error(error, 'Cleanup failed');
    process.exit(1);
});
