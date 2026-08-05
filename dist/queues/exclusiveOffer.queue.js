"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exclusiveOfferQueue = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
exports.exclusiveOfferQueue = new bullmq_1.Queue('exclusive-offer-queue', {
    connection: connection_1.redisConnection,
});
