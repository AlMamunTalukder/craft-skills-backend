"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveGiftQueue = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
exports.exclusiveGiftQueue = new bullmq_1.Queue('exclusive-gift-queue', {
    connection: connection_1.redisConnection,
});
