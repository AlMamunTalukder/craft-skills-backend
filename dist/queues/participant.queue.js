"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.participantQueue = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
exports.participantQueue = new bullmq_1.Queue('participant-queue', {
    connection: connection_1.redisConnection,
});
