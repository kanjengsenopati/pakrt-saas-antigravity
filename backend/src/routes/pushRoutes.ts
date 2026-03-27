import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { pushService } from '../services/pushService';

export default async function pushRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.post('/subscribe', {
        schema: {
            body: {
                type: 'object',
                required: ['subscription', 'warga_id'],
                properties: {
                    subscription: { type: 'object' },
                    warga_id: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        const { subscription, warga_id } = request.body as { subscription: any; warga_id: string };
        try {
            await pushService.subscribe(warga_id, subscription);
            return { success: true, message: 'Subscribed successfully' };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to subscribe' });
        }
    });

    fastify.post('/unsubscribe', {
        schema: {
            body: {
                type: 'object',
                required: ['endpoint'],
                properties: {
                    endpoint: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        const { endpoint } = request.body as { endpoint: string };
        try {
            await pushService.unsubscribe(endpoint);
            return { success: true, message: 'Unsubscribed successfully' };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to unsubscribe' });
        }
    });

    // Endpoint for testing push notification
    fastify.post('/test', async (request, reply) => {
        const { warga_id, title, body } = request.body as { warga_id: string; title: string; body: string };
        try {
            await pushService.sendNotificationToWarga(warga_id, {
                title: title || 'Test Notification',
                body: body || 'Ini adalah pesan percobaan dari sistem PAKRT.',
                icon: '/pwa-192x192.png',
                data: { url: '/dashboard' }
            });
            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to send test notification' });
        }
    });
}
