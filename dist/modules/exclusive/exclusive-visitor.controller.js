"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRegistered = exports.getVisitorStatus = exports.markVisitorRegistered = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../../config"));
const COOKIE_NAME = 'exclusive_visitor_id';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year
const STAGES = [
    { duration: 3 * 60 * 60 * 1000, label: '3 hours' }, // Stage 1: 3 hours
    { duration: 1 * 60 * 60 * 1000, label: '1 hour' }, // Stage 2: 1 hour
    { duration: 20 * 60 * 1000, label: '20 minutes' }, // Stage 3: 20 minutes
];
// Cumulative end (ms) of each stage measured from first visit
const STAGE_ENDS = [];
let totalDuration = 0;
for (const stage of STAGES) {
    totalDuration += stage.duration;
    STAGE_ENDS.push(totalDuration);
}
const COOKIE_OPTIONS = {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};
// Same SESSION_SECRET already required (>= 32 chars) in production.
// Used to HMAC-sign the cookie so visitors cannot tamper with the timer.
const SIGN_KEY = config_1.default.sessionSecret || 'exclusive-visitor-signing-key';
const signPayload = (payload) => crypto_1.default.createHmac('sha256', SIGN_KEY).update(payload).digest('base64url');
const encodeCookie = (data) => {
    const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
    return `${payload}.${signPayload(payload)}`;
};
const safeEqual = (a, b) => {
    const aBuf = Buffer.from(a, 'utf8');
    const bBuf = Buffer.from(b, 'utf8');
    if (aBuf.length !== bBuf.length)
        return false;
    return crypto_1.default.timingSafeEqual(aBuf, bBuf);
};
// Cookie format: `<base64url(payload)>.<hmacSignature>`.
// Old plain-JSON cookies (legacy) fail signature check and are treated as new visitors.
const readCookie = (req) => {
    const raw = req.cookies?.[COOKIE_NAME];
    if (!raw || typeof raw !== 'string')
        return null;
    const dot = raw.lastIndexOf('.');
    if (dot <= 0 || dot === raw.length - 1)
        return null;
    const payload = raw.slice(0, dot);
    const signature = raw.slice(dot + 1);
    // Tampered value => signature mismatch => rejected (fresh timer issued)
    if (!safeEqual(signature, signPayload(payload)))
        return null;
    try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        const now = Date.now();
        if (typeof parsed?.v === 'number' &&
            Number.isFinite(parsed.v) &&
            parsed.v > 0 &&
            parsed.v <= now + 5 * 60 * 1000 // sanity: no far-future timestamps
        ) {
            return { v: parsed.v, r: parsed.r === true };
        }
    }
    catch {
        // Malformed value - treated as a new visitor
    }
    return null;
};
const writeCookie = (res, data) => {
    res.cookie(COOKIE_NAME, encodeCookie(data), COOKIE_OPTIONS);
};
// Used by payment success to hide the popup for registered users
const markVisitorRegistered = (req, res) => {
    const data = readCookie(req) || { v: Date.now(), r: false };
    data.r = true;
    writeCookie(res, data);
};
exports.markVisitorRegistered = markVisitorRegistered;
const getVisitorStatus = async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
        const existing = readCookie(req);
        const data = existing || { v: Date.now(), r: false };
        if (!existing)
            writeCookie(res, data);
        // Already registered: hide the offer (matches previous behavior)
        if (data.r) {
            return res.json({
                success: true,
                status: 'registered',
                registered: true,
                isBlocked: false,
            });
        }
        const now = Date.now();
        const elapsed = now - data.v;
        // Entire offer window elapsed → blocked
        if (elapsed >= totalDuration) {
            return res.json({
                success: true,
                status: 'blocked',
                isBlocked: true,
                registered: false,
                message: 'Your time has expired. Please contact admin.',
            });
        }
        // Determine current stage from elapsed time
        let stage = 1;
        let stageEndMs = STAGE_ENDS[0];
        for (let i = 0; i < STAGE_ENDS.length; i++) {
            if (elapsed < STAGE_ENDS[i]) {
                stage = i + 1;
                stageEndMs = STAGE_ENDS[i];
                break;
            }
        }
        const expiryTime = new Date(data.v + stageEndMs);
        return res.json({
            success: true,
            status: 'active',
            stage,
            expiryTime: expiryTime.toISOString(),
            remainingMs: Math.max(0, expiryTime.getTime() - now),
            isBlocked: false,
            registered: false,
            stageLabel: STAGES[stage - 1].label,
        });
    }
    catch (error) {
        console.error('❌ Error in getVisitorStatus:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVisitorStatus = getVisitorStatus;
const markAsRegistered = async (req, res) => {
    try {
        (0, exports.markVisitorRegistered)(req, res);
        res.json({ success: true, message: 'Marked as registered' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAsRegistered = markAsRegistered;
