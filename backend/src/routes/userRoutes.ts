import { FastifyInstance } from 'fastify';
import { userService } from '../services/userService';
import { requirePermission } from '../middleware/auth';

export default async function userRoutes(fastify: FastifyInstance) {
    fastify.get('/', { preHandler: [requirePermission('Setup / Pengaturan', 'Lihat')] }, async (request, reply) => {
        const user = (request as any).user;
        const tenantId = user.tenant_id;
        const users = await userService.getAllByTenant(tenantId);
        return users;
    });

    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const userSession = (request as any).user;
        
        // Allow if user is an admin OR if they are requesting their own profile
        const isAdmin = userSession.role?.toLowerCase() === 'admin';
        const isSelf = userSession.id === id;

        if (!isAdmin && !isSelf) {
            // If not self, must have management permission
            try {
                // Manual check for permission since we removed it from preHandler for this specific route
                // Alternatively, we could define a more flexible requirePermission
                const hasPerm = await (request as any).hasPermission?.('Manajemen User / Role', 'Lihat');
                if (!hasPerm) {
                    return reply.code(403).send({ error: 'Forbidden' });
                }
            } catch (authError) {
                return reply.code(403).send({ error: 'Forbidden' });
            }
        }

        const user = await userService.getById(id);

        if (!user || user.tenant_id !== userSession.tenant_id) {
            return reply.code(404).send({ error: 'User not found or unauthorized' });
        }

        return user;
    });

    fastify.post('/', { preHandler: [requirePermission('Setup / Pengaturan', 'Buat')] }, async (request, reply) => {
        try {
            const userSession = (request as any).user;
            const data = request.body as any;
            data.tenant_id = userSession.tenant_id;
            
            const newUser = await userService.create(data);
            return reply.code(201).send(newUser);
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to create user', details: error.message });
        }
    });

    fastify.put('/:id', { preHandler: [requirePermission('Setup / Pengaturan', 'Ubah')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userSession = (request as any).user;
            
            const existing = await userService.getById(id);
            if (!existing || existing.tenant_id !== userSession.tenant_id) {
                return reply.code(404).send({ error: 'User not found or unauthorized' });
            }

            const data = request.body as any;
            data.tenant_id = userSession.tenant_id;

            const updatedUser = await userService.update(id, data);
            return updatedUser;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to update user', details: error.message });
        }
    });

    fastify.delete('/:id', { preHandler: [requirePermission('Setup / Pengaturan', 'Hapus')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userSession = (request as any).user;

            const existing = await userService.getById(id);
            if (!existing || existing.tenant_id !== userSession.tenant_id) {
                return reply.code(404).send({ error: 'User not found or unauthorized' });
            }

            await userService.delete(id);
            return reply.code(204).send();
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to delete user' });
        }
    });
}
