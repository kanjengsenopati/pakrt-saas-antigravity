import { FastifyInstance } from 'fastify';
import { roleService } from '../services/roleService';
import { requirePermission } from '../middleware/auth';

export default async function roleRoutes(fastify: FastifyInstance) {
    fastify.get('/', { preHandler: [requirePermission('Manajemen User / Role', 'Lihat')] }, async (request, reply) => {
        const user = (request as any).user;
        const tenantId = user.tenant_id;
        const roles = await roleService.getAllByTenant(tenantId);
        return roles;
    });

    fastify.get('/:id', { preHandler: [requirePermission('Manajemen User / Role', 'Lihat')] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = (request as any).user;
        const role = await roleService.getById(id);

        if (!role || role.tenant_id !== user.tenant_id) {
            return reply.code(404).send({ error: 'Role not found or unauthorized' });
        }

        return role;
    });

    fastify.post('/', { preHandler: [requirePermission('Manajemen User / Role', 'Buat')] }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const data = request.body as any;
            data.tenant_id = user.tenant_id;

            const newRole = await roleService.create(data);
            return reply.code(201).send(newRole);
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to create role', details: error.message });
        }
    });

    fastify.put('/:id', { preHandler: [requirePermission('Manajemen User / Role', 'Ubah')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;

            const existing = await roleService.getById(id);
            if (!existing || existing.tenant_id !== user.tenant_id) {
                return reply.code(404).send({ error: 'Role not found or unauthorized' });
            }

            const data = request.body as any;
            data.tenant_id = user.tenant_id;

            const updatedRole = await roleService.update(id, data);
            return updatedRole;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to update role', details: error.message });
        }
    });

    fastify.post('/sync', { preHandler: [requirePermission('Manajemen User / Role', 'Ubah')] }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const results = await roleService.syncDefaultRoles(user.tenant_id);
            return { message: 'Roles synchronized successfully', count: results.length };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to synchronize roles', details: error.message });
        }
    });

    fastify.delete('/:id', { preHandler: [requirePermission('Manajemen User / Role', 'Hapus')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;

            const existing = await roleService.getById(id);
            if (!existing || existing.tenant_id !== user.tenant_id) {
                return reply.code(404).send({ error: 'Role not found or unauthorized' });
            }

            await roleService.delete(id);
            return reply.code(204).send();
        } catch (err: any) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Failed to delete role' });
        }
    });

}
