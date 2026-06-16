import { Request, Response } from 'express';
import { ExclusiveVisitor } from './exclusive-visitor.model';
import { v4 as uuidv4 } from 'uuid';

const getVisitorId = (req: Request, res: Response): string => {
    // ✅ Check if cookie exists
    let visitorId = req.cookies?.exclusive_visitor_id;

    if (!visitorId) {
        visitorId = uuidv4();
        res.cookie('exclusive_visitor_id', visitorId, {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        console.log('🆕 New visitor cookie created:', visitorId);
    } else {
        console.log('🔁 Existing visitor cookie found:', visitorId);
    }

    return visitorId;
};

const STAGES = [
    { duration: 3 * 60 * 60 * 1000, label: '3 hours' }, // Stage 1: 3 hours
    { duration: 1 * 60 * 60 * 1000, label: '1 hour' }, // Stage 2: 1 hour
    { duration: 20 * 60 * 1000, label: '20 minutes' }, // Stage 3: 20 minutes
];

export const getVisitorStatus = async (req: Request, res: Response) => {
    try {
        const visitorId = getVisitorId(req, res);
        console.log('📋 Visitor ID from cookie:', visitorId);

        let visitor = await ExclusiveVisitor.findOne({ visitorId });
        const now = new Date();

        if (!visitor) {
            // First visit: create with 3 hours
            const expiryTime = new Date(now.getTime() + STAGES[0].duration);
            visitor = await ExclusiveVisitor.create({
                visitorId,
                stage: 1,
                expiryTime,
                isBlocked: false,
                registered: false,
            });
            console.log('🆕 New visitor created:', {
                visitorId,
                stage: 1,
                expiryTime: expiryTime.toISOString(),
            });
            return res.json({
                success: true,
                status: 'active',
                stage: 1,
                expiryTime: expiryTime.toISOString(),
                remainingMs: STAGES[0].duration,
                isBlocked: false,
                registered: false,
                stageLabel: STAGES[0].label,
            });
        }

        console.log('📊 Existing visitor found:', {
            visitorId,
            stage: visitor.stage,
            expiryTime: visitor.expiryTime,
            isBlocked: visitor.isBlocked,
            registered: visitor.registered,
        });

        // Already registered
        if (visitor.registered) {
            return res.json({
                success: true,
                status: 'registered',
                isBlocked: false,
                registered: true,
            });
        }

        // Blocked
        if (visitor.isBlocked) {
            return res.json({
                success: true,
                status: 'blocked',
                isBlocked: true,
                registered: false,
                message: 'Your time has expired. Please contact admin.',
            });
        }

        // Check if expiry time has passed
        const expiry = new Date(visitor.expiryTime);
        if (now >= expiry) {
            const nextStage = visitor.stage + 1;

            if (nextStage > STAGES.length) {
                visitor.isBlocked = true;
                await visitor.save();
                console.log('🚫 Visitor blocked after all stages:', visitorId);
                return res.json({
                    success: true,
                    status: 'blocked',
                    isBlocked: true,
                    registered: false,
                    message: 'Your time has expired. Please contact admin.',
                });
            }

            const newExpiry = new Date(now.getTime() + STAGES[nextStage - 1].duration);
            visitor.stage = nextStage;
            visitor.expiryTime = newExpiry;
            await visitor.save();

            console.log('⏭️ Moving to next stage:', {
                visitorId,
                newStage: nextStage,
                newExpiry: newExpiry.toISOString(),
            });

            return res.json({
                success: true,
                status: 'active',
                stage: nextStage,
                expiryTime: newExpiry.toISOString(),
                remainingMs: STAGES[nextStage - 1].duration,
                isBlocked: false,
                registered: false,
                stageLabel: STAGES[nextStage - 1].label,
            });
        }

        // Still active - return remaining time
        const remainingMs = expiry.getTime() - now.getTime();
        console.log('⏱️ Remaining time:', {
            visitorId,
            remainingMs,
            stage: visitor.stage,
        });

        return res.json({
            success: true,
            status: 'active',
            stage: visitor.stage,
            expiryTime: expiry.toISOString(),
            remainingMs,
            isBlocked: false,
            registered: false,
            stageLabel: STAGES[visitor.stage - 1].label,
        });
    } catch (error: any) {
        console.error('❌ Error in getVisitorStatus:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRegistered = async (req: Request, res: Response) => {
    try {
        const visitorId = getVisitorId(req, res);
        console.log('✅ Marking visitor as registered:', visitorId);

        const visitor = await ExclusiveVisitor.findOne({ visitorId });
        if (!visitor) {
            return res.status(404).json({ success: false, message: 'Visitor not found' });
        }
        visitor.registered = true;
        visitor.isBlocked = false;
        await visitor.save();
        res.json({ success: true, message: 'Marked as registered' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
