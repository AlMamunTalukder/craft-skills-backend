"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminarConfirmationQueue = void 0;
// server/queues/seminar-confirmation.queue.ts
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
exports.seminarConfirmationQueue = new bullmq_1.Queue('seminar-confirmation-queue', {
    connection: connection_1.redisConnection,
});
