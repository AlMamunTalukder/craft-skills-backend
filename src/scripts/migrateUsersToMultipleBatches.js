// scripts/migrateUsersToMultipleBatches.js
import mongoose from 'mongoose';
import User from '../src/modules/user/user.model';
import CourseBatch from '../src/modules/coursebatch/coursebatch.model';
import Admission from '../src/modules/admission/admission.model';

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({ role: 'student' });

    for (const user of users) {
        try {
            // Skip if already migrated
            if (user.batchIds && user.batchIds.length > 0) {
                console.log(`User ${user._id} already migrated`);
                continue;
            }

            // Find batch by batchNumber
            const batch = await CourseBatch.findOne({
                $or: [{ code: user.batchNumber }, { name: user.batchNumber }],
            });

            if (!batch) {
                console.log(
                    `Batch not found for user ${user._id}, batchNumber: ${user.batchNumber}`,
                );
                continue;
            }

            // Find admission
            const admission = await Admission.findOne({
                $or: [
                    { email: user.email, batchId: batch._id },
                    { phone: user.phone, batchId: batch._id },
                ],
            });

            // Update user
            await User.findByIdAndUpdate(user._id, {
                batchNumbers: [user.batchNumber],
                batchIds: [batch._id],
                admissionIds: admission ? [admission._id] : [],
                currentBatchId: batch._id,
                currentBatchNumber: user.batchNumber,
            });

            console.log(`Migrated user ${user._id}`);
        } catch (error) {
            console.error(`Error migrating user ${user._id}:`, error);
        }
    }

    console.log('Migration completed');
    process.exit(0);
}

migrate().catch(console.error);
