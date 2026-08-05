import crypto from 'crypto';
import type { Request, Response } from 'express';
import config from 'src/config';

const COOKIE_NAME = 'exclusive_visitor_id';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

const STAGES = [
    { duration: 3 * 60 * 60 * 1000, label: '3 hours' }, // Stage 1: 3 hours
    { duration: 1 * 60 * 60 * 1000, label: '1 hour' }, // Stage 2: 1 hour
    { duration: 20 * 60 * 1000, label: '20 minutes' }, // Stage 3: 20 minutes
];

// Cumulative end (ms) of each stage measured from first visit
const STAGE_ENDS: number[] = [];
let totalDuration = 0;
for (const stage of STAGES) {
    totalDuration += stage.duration;
    STAGE_ENDS.push(totalDuration);
}

interface VisitorData {
    v: number; // firstVisitAt (epoch ms)
    r: boolean; // registered flag
}

const COOKIE_OPTIONS = {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
};

// Same SESSION_SECRET already required (>= 32 chars) in production.
// Used to HMAC-sign the cookie so visitors cannot tamper with the timer.
const SIGN_KEY = config.sessionSecret || 'exclusive-visitor-signing-key';

const signPayload = (payload: string): string =>
    crypto.createHmac('sha256', SIGN_KEY).update(payload).digest('base64url');

const encodeCookie = (data: VisitorData): string => {
    const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
    return `${payload}.${signPayload(payload)}`;
};

const safeEqual = (a: string, b: string): boolean => {
    const aBuf = Buffer.from(a, 'utf8');
    const bBuf = Buffer.from(b, 'utf8');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
};

// Cookie format: `<base64url(payload)>.<hmacSignature>`.
// Old plain-JSON cookies (legacy) fail signature check and are treated as new visitors.
const readCookie = (req: Request): VisitorData | null => {
    const raw = req.cookies?.[COOKIE_NAME];
    if (!raw || typeof raw !== 'string') return null;

    const dot = raw.lastIndexOf('.');
    if (dot <= 0 || dot === raw.length - 1) return null;

    const payload = raw.slice(0, dot);
    const signature = raw.slice(dot + 1);

    // Tampered value => signature mismatch => rejected (fresh timer issued)
    if (!safeEqual(signature, signPayload(payload))) return null;

    try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        const now = Date.now();
        if (
            typeof parsed?.v === 'number' &&
            Number.isFinite(parsed.v) &&
            parsed.v > 0 &&
            parsed.v <= now + 5 * 60 * 1000 // sanity: no far-future timestamps
        ) {
            return { v: parsed.v, r: parsed.r === true };
        }
    } catch {
        // Malformed value - treated as a new visitor
    }
    return null;
};

const writeCookie = (res: Response, data: VisitorData): void => {
    res.cookie(COOKIE_NAME, encodeCookie(data), COOKIE_OPTIONS);
};

// Used by payment success to hide the popup for registered users
export const markVisitorRegistered = (req: Request, res: Response): void => {
    const data = readCookie(req) || { v: Date.now(), r: false };
    data.r = true;
    writeCookie(res, data);
};

export const getVisitorStatus = async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
        const existing = readCookie(req);
        const data = existing || { v: Date.now(), r: false };
        if (!existing) writeCookie(res, data);

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
    } catch (error: any) {
        console.error('❌ Error in getVisitorStatus:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRegistered = async (req: Request, res: Response) => {
    try {
        markVisitorRegistered(req, res);
        res.json({ success: true, message: 'Marked as registered' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
