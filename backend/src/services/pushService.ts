import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configure VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@pakrt.id';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );
}

export const pushService = {
    async subscribe(wargaId: String, subscription: any) {
        const { endpoint, keys } = subscription;
        return prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                warga_id: wargaId as string,
                p256dh: keys.p256dh,
                auth: keys.auth
            },
            create: {
                warga_id: wargaId as string,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            }
        });
    },

    async unsubscribe(endpoint: string) {
        return prisma.pushSubscription.deleteMany({
            where: { endpoint }
        });
    },

    async sendNotificationToWarga(wargaId: string, payload: { title: string; body: string; icon?: string; data?: any }) {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { warga_id: wargaId }
        });

        console.log(`Sending notification to Warga ${wargaId}. Found ${subscriptions.length} subscriptions.`);

        const notifications = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .then(() => console.log(`Push sent successfully to Warga ${wargaId}`))
                .catch(async (err) => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        // Subscription expired or no longer valid
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                    console.error('Error sending push notification:', err);
                });
        });

        return Promise.all(notifications);
    },

    async sendNotificationToScope(tenantId: string, scope: string, payload: { title: string; body: string; icon?: string; data?: any }) {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                warga: {
                    tenant_id: tenantId,
                    scope: scope
                }
            }
        });

        console.log(`Sending notification to Scope ${scope}. Found ${subscriptions.length} subscriptions.`);

        const notifications = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .then(() => console.log(`Push sent successfully to Scope ${scope} subscriber`))
                .catch(async (err) => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                    console.error('Error sending push notification:', err);
                });
        });

        return Promise.all(notifications);
    },

    async sendNotificationToAll(tenantId: string, payload: { title: string; body: string; icon?: string; data?: any }) {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                warga: {
                    tenant_id: tenantId
                }
            }
        });

        console.log(`Sending notification to All Warga in Tenant ${tenantId}. Found ${subscriptions.length} subscriptions.`);

        const notifications = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .then(() => console.log(`Push sent successfully to broadcast subscriber`))
                .catch(async (err) => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                    console.error('Error sending push notification:', err);
                });
        });

        return Promise.all(notifications);
    }
};
