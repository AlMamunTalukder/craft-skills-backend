import mongoose from 'mongoose';
import config from 'src/config';
import logger from 'src/shared/logger';

// One-time cleanup: the old visitor-tracking flow wrote one document per visitor,
// which bloated the free-tier MongoDB. The timer is now stateless (cookie-based),
// so this collection is no longer needed and can be emptied.
const cleanup = async (): Promise<void> => {
    await mongoose.connect(config.databaseUrl, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        tls: true,
    });

    const db = mongoose.connection.db;
    if (!db) {
        logger.error('Failed to get database handle');
        process.exit(1);
    }

    const collection = db.collection('exclusivevisitors');
    const result = await collection.deleteMany({});
    logger.info(`Deleted ${result.deletedCount} documents from "exclusivevisitors"`);

    await mongoose.disconnect();
    logger.info('Cleanup completed');
    process.exit(0);
};

cleanup().catch((error) => {
    logger.error(error, 'Cleanup failed');
    process.exit(1);
});
