import { Request, Response } from 'express';

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

interface VisitorCookie {
    v: number; // firstVisitAt (epoch ms)
    r: boolean; // registered flag
}

const COOKIE_OPTIONS = {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
};

const readCookie = (req: Request): VisitorCookie | null => {
    const raw = req.cookies?.[COOKIE_NAME];
    if (!raw) return null;
    try {
        const parsed = JSON.parse(decodeURIComponent(raw));
        if (typeof parsed?.v === 'number' && Number.isFinite(parsed.v)) {
            return { v: parsed.v, r: parsed.r === true };
        }
    } catch {
        // Malformed or legacy (uuid) cookie - treated as a new visitor
    }
    return null;
};

const writeCookie = (res: Response, data: VisitorCookie): void => {
    res.cookie(COOKIE_NAME, encodeURIComponent(JSON.stringify(data)), COOKIE_OPTIONS);
};

// Used by payment success to hide the popup for registered users
export const markVisitorRegistered = (req: Request, res: Response): void => {
    const data = readCookie(req) || { v: Date.now(), r: false };
    data.r = true;
    writeCookie(res, data);
};

export const getVisitorStatus = async (req: Request, res: Response) => {
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
