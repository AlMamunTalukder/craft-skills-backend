// src/utils/tracker.ts

import fetch from 'node-fetch';

export const trackEvent = async ({
    event,
    data,
}: {
    event: string;
    data?: Record<string, any>;
}) => {
    try {
        // 🔹 Console লগ (basic)
        console.log(`[TRACK] ${event}`, {
            ...data,
            time: new Date(),
        });

        // 🔹 GA4 Server-side tracking (optional)
        await fetch(
            'https://www.google-analytics.com/mp/collect?measurement_id=G-XXXX&api_secret=XXXX',
            {
                method: 'POST',
                body: JSON.stringify({
                    client_id: data?.phone || 'anonymous',
                    events: [
                        {
                            name: event,
                            params: data,
                        },
                    ],
                }),
            },
        );
    } catch (err) {
        console.error('Tracking Error:', err);
    }
};
