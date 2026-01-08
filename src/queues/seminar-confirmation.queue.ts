// server/queues/seminar-confirmation.queue.ts
import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const seminarConfirmationQueue = new Queue('seminar-confirmation-queue', {
    connection: redisConnection,
});
